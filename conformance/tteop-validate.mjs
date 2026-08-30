#!/usr/bin/env node
/**
 * conformance/tteop-validate.mjs
 *
 * `tteop validate` CLI — validates a single TTEOP v0.1-draft telemetry envelope
 * against the schema and semantic rules, and optionally computes metrics.
 *
 * Uses the shared validation module lib/envelope-validator.mjs — the single
 * source of truth for all three validation surfaces.
 *
 * Usage:
 *   node conformance/tteop-validate.mjs <payload.json> [--profile <mode>] [--report <format>] [--class <class>]
 *
 * Arguments:
 *   <payload.json>              path to the telemetry envelope JSON file
 *   --profile <privacy-mode>    expected deployment profile (asserts envelope matches)
 *                               (public-pseudonymous|private-managed-cohort|enterprise-isolated)
 *                               If omitted, only the envelope's declared mode is enforced.
 *   --class <conformance-class> conformance class to test
 *                               (producer|consumer|adapter|metric-engine|privacy-profile|full-platform)
 *                               default: full-platform
 *   --report <format>           output format (json|text|sarif)  default: text
 *
 * Exit codes (per conformance/classes.md §2.3):
 *   0 = all checks passed
 *   1 = one or more mandatory checks failed
 *   2 = schema validation error (payload is not valid JSON or does not match schema)
 *   3 = unsupported protocol version
 *   4 = internal error / usage error
 *
 * License: Apache-2.0
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateEnvelope,
  validateEnvelopeSchema,
  validateEnvelopeSemantics,
  computeMetrics,
  SUPPORTED_VERSIONS,
  SPEC_VERSION,
  METRIC_SPEC_VERSION,
} from "../lib/envelope-validator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function main() {
  const args = process.argv.slice(2);
  const payloadPath = args.find((a) => !a.startsWith("--"));
  if (!payloadPath) {
    console.error("Usage: tteop validate <payload.json> [--profile <mode>] [--class <class>] [--report <format>]");
    process.exit(4);
  }

  const profileIdx = args.indexOf("--profile");
  const expectedProfile = profileIdx !== -1 ? args[profileIdx + 1] : null;
  const classIdx = args.indexOf("--class");
  const conformanceClass = classIdx !== -1 ? args[classIdx + 1] : "full-platform";
  const reportIdx = args.indexOf("--report");
  const reportFormat = reportIdx !== -1 ? args[reportIdx + 1] : "text";

  // Validate option values
  // Normative classes per conformance/classes.md §1:
  //   producer, consumer, adapter, metric-engine, privacy-profile, full-platform
  // Convenience aliases (mapped to the normative class that performs that check):
  //   schema-only → consumer (schema validation only)
  //   semantic-only → privacy-profile (semantic validation only)
  //   full → full-platform (full schema + semantic validation)
  const CLASS_ALIASES = {
    "schema-only": "consumer",
    "semantic-only": "privacy-profile",
    "full": "full-platform",
  };
  const validClasses = ["producer", "consumer", "adapter", "metric-engine", "privacy-profile", "full-platform"];
  const resolvedClass = CLASS_ALIASES[conformanceClass] || conformanceClass;
  if (!validClasses.includes(resolvedClass)) {
    console.error(`Invalid --class value: ${conformanceClass}. Valid: ${validClasses.join(", ")} (or aliases: ${Object.keys(CLASS_ALIASES).join(", ")})`);
    process.exit(4);
  }
  const validFormats = ["json", "text", "sarif"];
  if (!validFormats.includes(reportFormat)) {
    console.error(`Invalid --report value: ${reportFormat}. Valid: ${validFormats.join(", ")}`);
    process.exit(4);
  }
  const validProfiles = ["public-pseudonymous", "private-managed-cohort", "enterprise-isolated", "all"];
  if (expectedProfile && !validProfiles.includes(expectedProfile)) {
    console.error(`Invalid --profile value: ${expectedProfile}. Valid: ${validProfiles.join(", ")}`);
    process.exit(4);
  }

  // Check for unknown options
  const knownOptions = ["--profile", "--class", "--report"];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && !knownOptions.includes(args[i])) {
      console.error(`Unknown option: ${args[i]}`);
      process.exit(4);
    }
  }

  if (!existsSync(payloadPath)) {
    console.error(`Payload not found: ${payloadPath}`);
    process.exit(4);
  }

  let envelope;
  try {
    envelope = JSON.parse(readFileSync(payloadPath, "utf8"));
  } catch (e) {
    console.error(`JSON parse error: ${e.message}`);
    process.exit(2);
  }

  // Version check (SRP-VER-002)
  if (envelope.protocol_version && !SUPPORTED_VERSIONS.includes(envelope.protocol_version)) {
    const versionError = `Unsupported protocol version: ${envelope.protocol_version}`;
    if (reportFormat === "json") {
      // Route through the report builder for consistent JSON output
      const report = buildConformanceReport({
        overall: "fail",
        payloadPath,
        schemaErrors: [],
        semanticErrors: [versionError],
        semanticWarnings: [],
        metricWarnings: [],
        metrics: null,
        expectedProfile,
        conformanceClass: resolvedClass,
        protocolVersion: envelope.protocol_version,
        privacyMode: envelope.privacy?.mode,
      });
      console.log(JSON.stringify(report, null, 2));
    } else if (reportFormat === "sarif") {
      console.log(JSON.stringify(sarifReport([{ ruleId: "TTEOP-VER-001", level: "error", message: versionError }]), null, 2));
    } else {
      console.error(versionError);
    }
    process.exit(3);
  }

  // Use the shared validator
  const options = {
    expectedProfile: expectedProfile || undefined,
    computeMetrics: true,
  };

  // For class-specific validation, split the checks.
  // Schema validation ALWAYS runs — even for privacy-profile (semantic-only) class,
  // because reporting "schema pass" without actually running schema validation would
  // be misleading. The class controls which checks count toward the overall result
  // and exit code, not which checks are executed.
  let schemaErrors = [];
  let semanticErrors = [];
  let semanticWarnings = [];
  let metrics = null;
  let metricWarnings = [];

  const schemaResult = validateEnvelopeSchema(envelope);
  schemaErrors = schemaResult.errors;

  if (resolvedClass === "consumer") {
    // Consumer: schema validation only (semantic checks skipped)
  } else if (resolvedClass === "privacy-profile") {
    // Privacy-profile: semantic validation only, but schema errors are still
    // reported for visibility. Schema errors do NOT count toward the overall
    // result for this class (the class tests semantic rules, not schema shape).
    const result = validateEnvelopeSemantics(envelope, options);
    semanticErrors = result.errors;
    semanticWarnings = result.warnings;
  } else {
    // producer, adapter, metric-engine, full-platform: full validation
    const result = validateEnvelopeSemantics(envelope, options);
    semanticErrors = result.errors;
    semanticWarnings = result.warnings;
    if (schemaErrors.length === 0 && semanticErrors.length === 0 && options.computeMetrics && envelope.telemetry) {
      const mresult = computeMetrics(envelope.telemetry);
      metrics = mresult.metrics;
      metricWarnings = mresult.warnings;
    }
  }

  // For privacy-profile class, schema errors are reported but do not count
  // toward the overall result (the class tests semantic rules only).
  const allErrors = [...schemaErrors, ...semanticErrors];
  const allWarnings = [...semanticWarnings, ...metricWarnings];
  const classRelevantErrors = resolvedClass === "privacy-profile" ? semanticErrors : allErrors;
  const overall = classRelevantErrors.length === 0 ? "pass" : "fail";

  // Build the conformance report (WS4: schema-conforming)
  const report = buildConformanceReport({
    overall,
    payloadPath,
    schemaErrors,
    semanticErrors,
    semanticWarnings,
    metricWarnings,
    metrics,
    expectedProfile,
    conformanceClass: resolvedClass,
    protocolVersion: envelope.protocol_version,
    privacyMode: envelope.privacy?.mode,
  });

  if (reportFormat === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else if (reportFormat === "sarif") {
    const sarifRuns = allErrors.length > 0 ? [{
      tool: { driver: { name: "tteop-validate", version: SPEC_VERSION } },
      results: allErrors.map((msg, i) => ({
        ruleId: `TTEOP-VAL-${String(i + 1).padStart(3, "0")}`,
        level: "error",
        message: { text: msg },
        locations: [{ physicalLocation: { artifactLocation: { uri: payloadPath } } }],
      })),
    }] : [];
    console.log(JSON.stringify({
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: sarifRuns,
    }, null, 2));
  } else {
    // text
    console.log(`TTEOP validate: ${payloadPath}`);
    console.log(`Overall: ${overall.toUpperCase()}`);
    console.log(`Protocol version: ${envelope.protocol_version}`);
    console.log(`Privacy mode (declared): ${envelope.privacy?.mode}`);
    if (expectedProfile) console.log(`Privacy profile (asserted): ${expectedProfile}`);
    console.log(`Conformance class: ${resolvedClass}${conformanceClass !== resolvedClass ? ` (alias: ${conformanceClass})` : ""}`);
    if (allErrors.length === 0) {
      console.log("All checks passed.");
    } else {
      console.log("Errors:");
      for (const e of allErrors) console.log(`  - ${e}`);
    }
    if (metrics) {
      console.log("Computed metrics:");
      for (const [k, v] of Object.entries(metrics)) console.log(`  ${k}: ${v}`);
    }
    if (allWarnings.length > 0) {
      console.log("Warnings:");
      for (const w of allWarnings) console.log(`  - ${w}`);
    }
  }

  // Exit codes
  if (schemaErrors.length > 0 && resolvedClass !== "privacy-profile") {
    process.exit(2);
  }
  process.exit(classRelevantErrors.length > 0 ? 1 : 0);
}

/**
 * Build a conformance report conforming to schemas/conformance-report-v0.1.schema.json.
 */
function buildConformanceReport(opts) {
  const tests = [];

  // Schema validation test
  tests.push({
    test_id: "SCHEMA-001",
    requirement_id: "SRP-VAL-001",
    description: "Envelope validates against JSON Schema 2020-12",
    result: opts.schemaErrors.length === 0 ? "pass" : "fail",
    error_message: opts.schemaErrors.length > 0 ? opts.schemaErrors.join("; ") : null,
  });

  // Semantic validation test
  if (opts.conformanceClass !== "consumer") {
    tests.push({
      test_id: "SEMANTIC-001",
      requirement_id: "SRP-VAL-002",
      description: "Envelope passes all semantic rules",
      result: opts.semanticErrors.length === 0 ? "pass" : "fail",
      error_message: opts.semanticErrors.length > 0 ? opts.semanticErrors.join("; ") : null,
    });

    if (opts.expectedProfile) {
      tests.push({
        test_id: "PROFILE-001",
        requirement_id: "SRP-PRIV-001",
        description: `Envelope matches asserted profile: ${opts.expectedProfile}`,
        result: opts.semanticErrors.some(e => e.includes("--profile")) ? "fail" : "pass",
        error_message: null,
      });
    }
  }

  return {
    report_version: "tteop-conformance/0.1-draft",
    timestamp: new Date().toISOString(),
    protocol_version: opts.protocolVersion || SPEC_VERSION,
    metric_spec_version: METRIC_SPEC_VERSION,
    conformance_class: opts.conformanceClass,
    overall_result: opts.overall,
    conformance_runner_version: "tteop-validate/0.1-draft",
    implementation_under_test: {
      name: opts.payloadPath,
    },
    privacy_profile_tested: opts.expectedProfile || opts.privacyMode || undefined,
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter(t => t.result === "pass").length,
      failed: tests.filter(t => t.result === "fail").length,
    },
    allowed_claims: opts.overall === "pass" ? ["schema-valid", "semantic-valid"] : [],
    prohibited_claims: ["TTEOP Conformant", "TTEOP Certified", "independently validated"],
  };
}

function sarifReport(results) {
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "tteop-validate", version: SPEC_VERSION } },
      results: results.map(r => ({
        ruleId: r.ruleId,
        level: r.level,
        message: { text: r.message },
      })),
    }],
  };
}

main();

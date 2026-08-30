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
 *   --class <conformance-class> conformance class to test (full|schema-only|semantic-only)
 *                               default: full
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
  const conformanceClass = classIdx !== -1 ? args[classIdx + 1] : "full";
  const reportIdx = args.indexOf("--report");
  const reportFormat = reportIdx !== -1 ? args[reportIdx + 1] : "text";

  // Validate option values
  const validClasses = ["full", "schema-only", "semantic-only"];
  if (!validClasses.includes(conformanceClass)) {
    console.error(`Invalid --class value: ${conformanceClass}. Valid: ${validClasses.join(", ")}`);
    process.exit(4);
  }
  const validFormats = ["json", "text", "sarif"];
  if (!validFormats.includes(reportFormat)) {
    console.error(`Invalid --report value: ${reportFormat}. Valid: ${validFormats.join(", ")}`);
    process.exit(4);
  }
  const validProfiles = ["public-pseudonymous", "private-managed-cohort", "enterprise-isolated"];
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
    if (reportFormat === "json") {
      console.log(JSON.stringify({ overall_result: "fail", error: `unsupported_version: ${envelope.protocol_version}` }));
    } else if (reportFormat === "sarif") {
      console.log(JSON.stringify(sarifReport([{ ruleId: "TTEOP-VER-001", level: "error", message: `Unsupported protocol version: ${envelope.protocol_version}` }]), null, 2));
    } else {
      console.error(`Unsupported protocol version: ${envelope.protocol_version}`);
    }
    process.exit(3);
  }

  // Use the shared validator
  const options = {
    expectedProfile: expectedProfile || undefined,
    computeMetrics: conformanceClass !== "schema-only",
  };

  // For class-specific validation, split the checks
  let schemaErrors = [];
  let semanticErrors = [];
  let semanticWarnings = [];
  let metrics = null;
  let metricWarnings = [];

  if (conformanceClass === "schema-only") {
    const result = validateEnvelopeSchema(envelope);
    schemaErrors = result.errors;
  } else if (conformanceClass === "semantic-only") {
    const result = validateEnvelopeSemantics(envelope, options);
    semanticErrors = result.errors;
    semanticWarnings = result.warnings;
  } else {
    // full
    const result = validateEnvelope(envelope, options);
    schemaErrors = result.schemaErrors;
    semanticErrors = result.semanticErrors;
    semanticWarnings = result.semanticWarnings;
    metrics = result.metrics;
    metricWarnings = result.metricWarnings;
  }

  const allErrors = [...schemaErrors, ...semanticErrors];
  const allWarnings = [...semanticWarnings, ...metricWarnings];
  const overall = allErrors.length === 0 ? "pass" : "fail";

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
    conformanceClass,
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
    console.log(`Conformance class: ${conformanceClass}`);
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
  if (schemaErrors.length > 0 && conformanceClass !== "semantic-only") {
    process.exit(2);
  }
  process.exit(allErrors.length > 0 ? 1 : 0);
}

/**
 * Build a conformance report conforming to schemas/conformance-report-v0.1.schema.json.
 */
function buildConformanceReport(opts) {
  const tests = [];

  // Schema validation test
  tests.push({
    test_id: "SCHEMA-001",
    description: "Envelope validates against JSON Schema 2020-12",
    result: opts.schemaErrors.length === 0 ? "pass" : "fail",
    errors: opts.schemaErrors.length > 0 ? opts.schemaErrors : undefined,
  });

  // Semantic validation test
  if (opts.conformanceClass !== "schema-only") {
    tests.push({
      test_id: "SEMANTIC-001",
      description: "Envelope passes all semantic rules",
      result: opts.semanticErrors.length === 0 ? "pass" : "fail",
      errors: opts.semanticErrors.length > 0 ? opts.semanticErrors : undefined,
    });

    if (opts.expectedProfile) {
      tests.push({
        test_id: "PROFILE-001",
        description: `Envelope matches asserted profile: ${opts.expectedProfile}`,
        result: opts.semanticErrors.some(e => e.includes("--profile")) ? "fail" : "pass",
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
    implementation_under_test: opts.payloadPath,
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

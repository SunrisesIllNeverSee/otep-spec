#!/usr/bin/env node
/**
 * conformance/otep-validate.mjs
 *
 * `otep validate` CLI — validates a single OTEP v0.1-draft telemetry envelope
 * against the schema and semantic rules, and optionally computes metrics.
 *
 * Uses ajv for full JSON Schema 2020-12 validation.
 *
 * Usage:
 *   node conformance/otep-validate.mjs <payload.json> [--profile <mode>] [--report <format>]
 *
 * Arguments:
 *   <payload.json>              path to the telemetry envelope JSON file
 *   --profile <privacy-mode>    expected deployment profile (asserts envelope matches)
 *                               (public-pseudonymous|private-managed-cohort|enterprise-isolated)
 *                               If omitted, only the envelope's declared mode is enforced.
 *   --report <format>           output format (json|text)  default: text
 *
 * Exit codes (per conformance/classes.md §2.3):
 *   0 = all checks passed
 *   1 = one or more mandatory checks failed
 *   2 = schema validation error (payload is not valid JSON or does not match schema)
 *   3 = unsupported protocol version
 *   4 = internal error
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function roundBankers(n, d) {
  if (n === null || !Number.isFinite(n)) return null;
  const factor = Math.pow(10, d);
  const scaled = n * factor;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let rounded;
  if (diff > 0.5) rounded = floor + 1;
  else if (diff < 0.5) rounded = floor;
  else rounded = floor % 2 === 0 ? floor : floor + 1;
  return rounded / factor;
}

function computeMetrics(t) {
  const input = t.input;
  const output = t.output;
  const cacheWrite = t.cache_write ?? null;
  const cacheRead = t.cache_read ?? null;
  const warnings = [];
  const cacheWarnings = [];
  if (cacheWrite === null) cacheWarnings.push("cache_write is unavailable; log_leverage is undefined.");
  if (cacheRead === null) cacheWarnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");
  const ofDenom = input + output;
  const outputFraction = ofDenom > 0 ? output / ofDenom : null;
  if (outputFraction === null) warnings.push("output_fraction_undefined: input+output=0");
  const velocity = input > 0 ? output / input : null;
  if (velocity === null) warnings.push("velocity_undefined: input=0");
  let leverage = null;
  if (cacheRead === null) { /* unavailable */ }
  else if (input > 0) { leverage = cacheRead / input; }
  else { warnings.push("leverage_undefined: input=0"); }
  let y = null;
  if (cacheRead === null) { /* unavailable */ }
  else if (leverage !== null && velocity !== null) { y = leverage * velocity; }
  else { warnings.push("yield_undefined: requires input>0"); }
  let logLeverage = null;
  if (cacheWrite === null || cacheRead === null) { warnings.push("log_leverage_undefined: requires all four pillars > 0"); }
  else if (input > 0 && output > 0 && cacheWrite > 0 && cacheRead > 0) { logLeverage = Math.log10(cacheRead / input); }
  else { warnings.push("log_leverage_undefined: requires all four pillars > 0"); }
  return {
    metrics: {
      yield: roundBankers(y, 2),
      leverage: roundBankers(leverage, 1),
      velocity: roundBankers(velocity, 3),
      output_fraction: roundBankers(outputFraction, 4),
      log_leverage: roundBankers(logLeverage, 2),
    },
    warnings: [...cacheWarnings, ...warnings],
  };
}

const FORBIDDEN_FIELDS = ["prompt", "prompt_text", "completion", "completion_text", "response_text", "source_code", "code", "diff", "keystrokes", "screen_content", "file_path", "file_content", "repo_content"];

function validateSemantics(envelope) {
  const errors = [];
  const t = envelope.telemetry;
  if (!t) { errors.push("telemetry object missing"); return errors; }
  if (t.input === null) errors.push("input is null (MUST NOT be null)");
  if (t.output === null) errors.push("output is null (MUST NOT be null)");
  if (typeof t.input !== "number" || t.input < 0) errors.push("input is not a non-negative integer");
  if (typeof t.output !== "number" || t.output < 0) errors.push("output is not a non-negative integer");
  if (t.cache_write !== null && (typeof t.cache_write !== "number" || t.cache_write < 0)) errors.push("cache_write is not a non-negative integer or null");
  if (t.cache_read !== null && (typeof t.cache_read !== "number" || t.cache_read < 0)) errors.push("cache_read is not a non-negative integer or null");
  if (t.cache_write === null) {
    const flags = envelope.validity?.missingness_flags ?? [];
    if (!flags.some((f) => f.startsWith("cache_write_"))) errors.push("cache_write is null but no cache_write_* missingness flag (SRP-MISS-001)");
  }
  if (t.cache_read === null) {
    const flags = envelope.validity?.missingness_flags ?? [];
    if (!flags.some((f) => f.startsWith("cache_read_"))) errors.push("cache_read is null but no cache_read_* missingness flag (SRP-MISS-002)");
  }
  function checkForbidden(obj, p) {
    if (typeof obj !== "object" || obj === null) return;
    for (const key of Object.keys(obj)) {
      if (FORBIDDEN_FIELDS.includes(key)) errors.push(`forbidden field name "${key}" at ${p} (SRP-VAL-006)`);
      checkForbidden(obj[key], `${p}.${key}`);
    }
  }
  checkForbidden(envelope, "envelope");

  // P2-8: raw_provider_fields must only contain adapter-declared scalar metadata
  if (envelope.raw_provider_fields) {
    for (const [key, val] of Object.entries(envelope.raw_provider_fields)) {
      if (typeof val === "object" && val !== null) {
        errors.push(`raw_provider_fields.${key} contains non-scalar value (SRP-VAL-007)`);
      }
    }
  }

  // P1-5: signed provenance with signature_status "valid" is not verified in v0.1
  if (envelope.provenance?.level === "signed" && envelope.provenance?.signature_status === "valid") {
    errors.push("provenance.level is 'signed' with signature_status 'valid' but v0.1 does not implement cryptographic verification (SRP-PROV-005). Use 'signature-present-unverified' or downgrade to 'collector-attested'.");
  }

  return errors;
}

// P1-4: Always enforce the envelope's declared privacy mode
function validatePrivacyMode(envelope) {
  const errors = [];
  const mode = envelope.privacy?.mode;
  if (!mode) return errors; // schema will catch missing mode

  if (mode === "public-pseudonymous") {
    if (envelope.operator?.cohort_id != null) {
      errors.push("public-pseudonymous mode MUST NOT include cohort_id (SRP-PRIV-002)");
    }
  }
  if (mode === "private-managed-cohort") {
    if (envelope.operator?.cohort_id == null) {
      errors.push("private-managed-cohort mode SHOULD include cohort_id (SRP-PRIV-004)");
    }
  }
  // enterprise-isolated: no external transmission, no additional field checks needed
  return errors;
}

// P1-4: --profile asserts an expected mode, does not enable/disable rules
function validateProfileAssertion(envelope, expectedProfile) {
  const errors = [];
  const mode = envelope.privacy?.mode;
  if (expectedProfile && mode && mode !== expectedProfile) {
    errors.push(`privacy.mode is "${mode}" but expected profile "${expectedProfile}" (--profile assertion)`);
  }
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const payloadPath = args.find((a) => !a.startsWith("--"));
  if (!payloadPath) {
    console.error("Usage: otep validate <payload.json> [--profile <mode>] [--report <format>]");
    process.exit(4);
  }
  const profileIdx = args.indexOf("--profile");
  const expectedProfile = profileIdx !== -1 ? args[profileIdx + 1] : null;
  const reportIdx = args.indexOf("--report");
  const reportFormat = reportIdx !== -1 ? args[reportIdx + 1] : "text";

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

  const schemaPath = join(ROOT, "schemas", "telemetry-envelope-v0.1.schema.json");
  if (!existsSync(schemaPath)) {
    console.error(`Schema not found: ${schemaPath}`);
    process.exit(4);
  }
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

  // Version check (SRP-VER-002)
  const supportedVersions = ["otep/0.1-draft", "sigrank/0.1-draft"];
  if (envelope.protocol_version && !supportedVersions.includes(envelope.protocol_version)) {
    if (reportFormat === "json") {
      console.log(JSON.stringify({ overall_result: "fail", error: `unsupported_version: ${envelope.protocol_version}` }));
    } else {
      console.error(`Unsupported protocol version: ${envelope.protocol_version}`);
    }
    process.exit(3);
  }

  // P1-3: Full JSON Schema 2020-12 validation via ajv
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const schemaValid = validate(envelope);
  const schemaErrors = schemaValid ? [] : (validate.errors || []).map(e => {
    const path = e.instancePath || "(root)";
    return `schema ${path}: ${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ""}`;
  });

  if (schemaErrors.length > 0) {
    if (reportFormat === "json") {
      console.log(JSON.stringify({ overall_result: "fail", schema_errors: schemaErrors }, null, 2));
    } else {
      console.error("Schema validation failed:");
      for (const e of schemaErrors) console.error(`  ${e}`);
    }
    process.exit(2);
  }

  const semanticErrors = validateSemantics(envelope);
  const privacyErrors = validatePrivacyMode(envelope); // always enforce declared mode
  const profileErrors = expectedProfile ? validateProfileAssertion(envelope, expectedProfile) : [];
  const allErrors = [...semanticErrors, ...privacyErrors, ...profileErrors];

  // Compute metrics
  const { metrics, warnings } = computeMetrics(envelope.telemetry);

  const overall = allErrors.length === 0 ? "pass" : "fail";

  if (reportFormat === "json") {
    console.log(JSON.stringify({
      report_version: "otep-conformance/0.1-draft",
      timestamp: new Date().toISOString(),
      protocol_version: envelope.protocol_version,
      payload: payloadPath,
      privacy_mode_declared: envelope.privacy?.mode,
      privacy_profile_asserted: expectedProfile,
      overall_result: overall,
      schema_errors: schemaErrors,
      semantic_errors: semanticErrors,
      privacy_errors: privacyErrors,
      profile_errors: profileErrors,
      computed_metrics: metrics,
      warnings,
    }, null, 2));
  } else {
    console.log(`OTEP validate: ${payloadPath}`);
    console.log(`Overall: ${overall.toUpperCase()}`);
    console.log(`Protocol version: ${envelope.protocol_version}`);
    console.log(`Privacy mode (declared): ${envelope.privacy?.mode}`);
    if (expectedProfile) console.log(`Privacy profile (asserted): ${expectedProfile}`);
    if (allErrors.length === 0) {
      console.log("All checks passed.");
    } else {
      console.log("Errors:");
      for (const e of allErrors) console.log(`  - ${e}`);
    }
    console.log("Computed metrics:");
    for (const [k, v] of Object.entries(metrics)) console.log(`  ${k}: ${v}`);
    if (warnings.length > 0) {
      console.log("Warnings:");
      for (const w of warnings) console.log(`  - ${w}`);
    }
  }

  process.exit(allErrors.length > 0 ? 1 : 0);
}

main();

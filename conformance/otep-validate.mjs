#!/usr/bin/env node
/**
 * conformance/otep-validate.mjs
 *
 * `otep validate` CLI — validates a single OTEP v0.1-draft telemetry envelope
 * against the schema and semantic rules, and optionally computes metrics.
 *
 * Usage:
 *   node conformance/otep-validate.mjs <payload.json> [--profile <mode>] [--report <format>]
 *
 * Arguments:
 *   <payload.json>              path to the telemetry envelope JSON file
 *   --profile <privacy-mode>    privacy mode to validate against
 *                               (public-pseudonymous|private-managed-cohort|enterprise-isolated|all)
 *                               default: all
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Reuse the runner's validator and metric engine by dynamic import.
const runnerUrl = new URL("./otep-runner.mjs", import.meta.url);
// The runner exports its internals via a side-effect-free module? No — it
// runs main() on import. To avoid that, we re-implement the needed functions
// inline (they are small and self-contained).

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
  if (cacheWrite === null) warnings.push("cache_write is unavailable; log_leverage is undefined.");
  if (cacheRead === null) warnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");
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
    warnings,
  };
}

function checkType(value, typeDecl, path, errors) {
  const types = Array.isArray(typeDecl) ? typeDecl : [typeDecl];
  let matched = false;
  for (const t of types) {
    if (value === null) { if (t === "null") { matched = true; break; } continue; }
    if (t === "integer") { if (typeof value === "number" && Number.isInteger(value) && !Number.isNaN(value)) { matched = true; break; } }
    else if (t === "number") { if (typeof value === "number" && !Number.isNaN(value)) { matched = true; break; } }
    else if (t === "string") { if (typeof value === "string") { matched = true; break; } }
    else if (t === "object") { if (typeof value === "object" && value !== null && !Array.isArray(value)) { matched = true; break; } }
    else if (t === "array") { if (Array.isArray(value)) { matched = true; break; } }
    else if (t === "boolean") { if (typeof value === "boolean") { matched = true; break; } }
  }
  if (!matched) errors.push(`schema ${path}: expected type ${JSON.stringify(typeDecl)}, got ${value === null ? "null" : typeof value}`);
}

function validateSchemaNode(value, node, path, errors) {
  if ("const" in node) { if (value !== node.const) errors.push(`schema ${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`); return; }
  if ("enum" in node) { if (!node.enum.includes(value)) errors.push(`schema ${path}: expected one of ${JSON.stringify(node.enum)}, got ${JSON.stringify(value)}`); }
  if ("type" in node) checkType(value, node.type, path, errors);
  if ("minimum" in node && typeof value === "number" && !Number.isNaN(value)) { if (value < node.minimum) errors.push(`schema ${path}: value ${value} below minimum ${node.minimum}`); }
  if ("minLength" in node && typeof value === "string") { if (value.length < node.minLength) errors.push(`schema ${path}: string length ${value.length} below minLength ${node.minLength}`); }
  if ("required" in node && typeof value === "object" && value !== null && !Array.isArray(value)) { for (const req of node.required) { if (!(req in value)) errors.push(`schema ${path}: missing required field "${req}"`); } }
  if (node.additionalProperties === false && typeof value === "object" && value !== null && !Array.isArray(value)) { const allowed = new Set(Object.keys(node.properties || {})); for (const key of Object.keys(value)) { if (!allowed.has(key)) errors.push(`schema ${path}: additional property "${key}" not allowed`); } }
  if ("properties" in node && typeof value === "object" && value !== null && !Array.isArray(value)) { for (const [key, sub] of Object.entries(node.properties)) { if (key in value) validateSchemaNode(value[key], sub, `${path}.${key}`, errors); } }
  if ("items" in node && Array.isArray(value)) { for (let i = 0; i < value.length; i++) validateSchemaNode(value[i], node.items, `${path}[${i}]`, errors); }
}

function validateAgainstSchema(record, schema) {
  const errors = [];
  validateSchemaNode(record, schema, "", errors);
  return errors;
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
  return errors;
}

function validatePrivacyProfile(envelope, profile) {
  const errors = [];
  const mode = envelope.privacy?.mode;
  if (profile === "all") return errors;
  if (profile === "public-pseudonymous") {
    if (envelope.operator?.cohort_id != null) errors.push("public-pseudonymous mode MUST NOT include cohort_id (SRP-PRIV-002)");
  }
  if (profile === "enterprise-isolated") {
    // Enterprise mode not transmitted externally — this check only flags
    // if the envelope claims enterprise-isolated but is being validated
    // against a public profile.
  }
  if (mode && profile !== "all" && mode !== profile) {
    errors.push(`privacy.mode is "${mode}" but validating against profile "${profile}"`);
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
  const profile = profileIdx !== -1 ? args[profileIdx + 1] : "all";
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

  const schemaErrors = validateAgainstSchema(envelope, schema);
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
  const privacyErrors = validatePrivacyProfile(envelope, profile);
  const allErrors = [...semanticErrors, ...privacyErrors];

  // Compute metrics
  const { metrics, warnings } = computeMetrics(envelope.telemetry);

  const overall = allErrors.length === 0 ? "pass" : "fail";

  if (reportFormat === "json") {
    console.log(JSON.stringify({
      report_version: "otep-conformance/0.1-draft",
      timestamp: new Date().toISOString(),
      protocol_version: envelope.protocol_version,
      payload: payloadPath,
      privacy_profile_tested: profile,
      overall_result: overall,
      schema_errors: schemaErrors,
      semantic_errors: semanticErrors,
      privacy_errors: privacyErrors,
      computed_metrics: metrics,
      warnings,
    }, null, 2));
  } else {
    console.log(`OTEP validate: ${payloadPath}`);
    console.log(`Overall: ${overall.toUpperCase()}`);
    console.log(`Protocol version: ${envelope.protocol_version}`);
    console.log(`Privacy profile: ${profile}`);
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

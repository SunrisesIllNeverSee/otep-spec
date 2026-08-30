#!/usr/bin/env node
/**
 * conformance/tests/alias-acceptance-test.mjs
 *
 * Regression coverage for C6: legacy protocol-version alias acceptance.
 * Verifies that envelopes carrying the pre-rename wire identifier
 * `otep/0.1-draft` and the legacy distribution alias `sigrank/0.1-draft`
 * are accepted by every public validation surface (validator module,
 * CLI `tteop validate`, and JSON schema).
 *
 * License: Apache-2.0
 */

import { writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { validateEnvelope, SUPPORTED_VERSIONS, SPEC_VERSION } from "../../lib/envelope-validator.mjs";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const VALIDATE = join(ROOT, "conformance", "tteop-validate.mjs");
const SCHEMA_PATH = join(ROOT, "schemas", "telemetry-envelope-v0.1.schema.json");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  \u2717 ${label}`);
  }
}

// Load a known-valid envelope and swap only the protocol_version
const canonical = JSON.parse(readFileSync(join(ROOT, "examples", "complete-valid.json"), "utf8"));

function validateViaCli(envelope, label) {
  const tmpDir = mkdtempSync(join(tmpdir(), "tteop-alias-"));
  const filePath = join(tmpDir, "envelope.json");
  writeFileSync(filePath, JSON.stringify(envelope, null, 2));
  try {
    const output = execSync(`node ${VALIDATE} ${filePath} --report text`, {
      encoding: "utf8", cwd: ROOT, stdio: "pipe",
    });
    const isPass = output.includes("Overall: PASS");
    assert(isPass, `${label}: CLI validator accepts (Overall: PASS)`);
    if (!isPass) console.log(`    Output: ${output.split("\n").slice(0, 5).join(" | ")}`);
    return isPass;
  } catch (e) {
    const output = e.stdout || e.stderr || e.message;
    assert(false, `${label}: CLI validator accepts \u2014 ${output.split("\n")[0]}`);
    return false;
  }
}

console.log("=== Legacy alias acceptance (C6) ===\n");

// 1. SUPPORTED_VERSIONS includes both legacy aliases
assert(SUPPORTED_VERSIONS.includes("otep/0.1-draft"),
  "Validator exports: otep/0.1-draft in SUPPORTED_VERSIONS");
assert(SUPPORTED_VERSIONS.includes("sigrank/0.1-draft"),
  "Validator exports: sigrank/0.1-draft in SUPPORTED_VERSIONS");
assert(SPEC_VERSION === "tteop/0.1-draft",
  "Validator exports: SPEC_VERSION is tteop/0.1-draft");

// 2. Schema enum includes all three versions
const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const enumValues = schema.properties.protocol_version.enum;
assert(enumValues.includes("tteop/0.1-draft"), "Schema enum: tteop/0.1-draft present");
assert(enumValues.includes("otep/0.1-draft"), "Schema enum: otep/0.1-draft present");
assert(enumValues.includes("sigrank/0.1-draft"), "Schema enum: sigrank/0.1-draft present");

// 3. Validator module accepts otep/0.1-draft
const otepEnvelope = { ...canonical, protocol_version: "otep/0.1-draft" };
const otepResult = validateEnvelope(otepEnvelope);
assert(!otepResult.schemaErrors?.some(e => e.includes("protocol_version")),
  "Validator module: otep/0.1-draft passes schema check");

// 4. Validator module accepts sigrank/0.1-draft
const sigrankEnvelope = { ...canonical, protocol_version: "sigrank/0.1-draft" };
const sigrankResult = validateEnvelope(sigrankEnvelope);
assert(!sigrankResult.schemaErrors?.some(e => e.includes("protocol_version")),
  "Validator module: sigrank/0.1-draft passes schema check");

// 5. CLI validator accepts otep/0.1-draft
validateViaCli(otepEnvelope, "CLI: otep/0.1-draft");

// 6. CLI validator accepts sigrank/0.1-draft
validateViaCli(sigrankEnvelope, "CLI: sigrank/0.1-draft");

// 7. Unknown version still rejected (negative control)
const badEnvelope = { ...canonical, protocol_version: "tteop/9.9" };
const tmpDir = mkdtempSync(join(tmpdir(), "tteop-alias-"));
const badPath = join(tmpDir, "bad.json");
writeFileSync(badPath, JSON.stringify(badEnvelope, null, 2));
try {
  execSync(`node ${VALIDATE} ${badPath} --report text`, {
    encoding: "utf8", cwd: ROOT, stdio: "pipe",
  });
  assert(false, "CLI: tteop/9.9 correctly rejected (expected non-zero exit)");
} catch (e) {
  assert(true, "CLI: tteop/9.9 correctly rejected (non-zero exit)");
}

// ─── CodeRabbit minor #2: legacy/canonical metric alias conflict handling ───
// SPEC §26.4/26.5. Protocol aliases must be lossless and deterministic.
// Silently choosing one conflicting value creates cross-implementation ambiguity.
console.log("\n=== Legacy metric alias conflict handling (CodeRabbit #2) ===\n");

// Build a metrics-only test base: canonical envelope with valid metrics.
const canonicalMetrics = { ...canonical.metrics };

// 8. Alias-only (snr present, output_fraction absent) → normalized and accepted
const aliasOnly = { ...canonical, metrics: { ...canonicalMetrics } };
delete aliasOnly.metrics.output_fraction;
aliasOnly.metrics.snr = canonicalMetrics.output_fraction;
const aliasOnlyResult = validateEnvelope(aliasOnly);
assert(aliasOnlyResult.valid,
  "Alias-only: snr→output_fraction normalized and accepted");
assert(!aliasOnlyResult.schemaErrors?.some(e => e.includes("snr") || e.includes("output_fraction")),
  "Alias-only: no schema error mentioning snr or output_fraction");

// 9. Matching pair (snr == output_fraction) → accepted, alias dropped
const matchingPair = { ...canonical, metrics: { ...canonicalMetrics } };
matchingPair.metrics.snr = canonicalMetrics.output_fraction; // same value
const matchingResult = validateEnvelope(matchingPair);
assert(matchingResult.valid,
  "Matching pair: snr==output_fraction accepted (alias dropped, canonical kept)");
assert(!matchingResult.schemaErrors?.some(e => e.includes("conflict")),
  "Matching pair: no conflict error");

// 10. Conflicting pair (snr != output_fraction) → REJECTED
const conflictingPair = { ...canonical, metrics: { ...canonicalMetrics } };
conflictingPair.metrics.snr = canonicalMetrics.output_fraction + 0.1; // different value
const conflictingResult = validateEnvelope(conflictingPair);
assert(!conflictingResult.valid,
  "Conflicting pair: snr!=output_fraction rejected (hard fail)");
assert(conflictingResult.schemaErrors?.some(e => e.includes("conflict") && e.includes("snr") && e.includes("output_fraction")),
  "Conflicting pair: error mentions conflict + snr + output_fraction");

// 11. Alias-only (dev10x present, log_leverage absent) → normalized and accepted
const aliasOnlyDev = { ...canonical, metrics: { ...canonicalMetrics } };
delete aliasOnlyDev.metrics.log_leverage;
aliasOnlyDev.metrics.dev10x = canonicalMetrics.log_leverage;
const aliasOnlyDevResult = validateEnvelope(aliasOnlyDev);
assert(aliasOnlyDevResult.valid,
  "Alias-only: dev10x→log_leverage normalized and accepted");

// 12. Matching pair (dev10x == log_leverage) → accepted
const matchingDev = { ...canonical, metrics: { ...canonicalMetrics } };
matchingDev.metrics.dev10x = canonicalMetrics.log_leverage; // same value
const matchingDevResult = validateEnvelope(matchingDev);
assert(matchingDevResult.valid,
  "Matching pair: dev10x==log_leverage accepted");

// 13. Conflicting pair (dev10x != log_leverage) → REJECTED
const conflictingDev = { ...canonical, metrics: { ...canonicalMetrics } };
conflictingDev.metrics.dev10x = canonicalMetrics.log_leverage + 1.0; // different value
const conflictingDevResult = validateEnvelope(conflictingDev);
assert(!conflictingDevResult.valid,
  "Conflicting pair: dev10x!=log_leverage rejected (hard fail)");
assert(conflictingDevResult.schemaErrors?.some(e => e.includes("conflict") && e.includes("dev10x") && e.includes("log_leverage")),
  "Conflicting pair: error mentions conflict + dev10x + log_leverage");

// 14. Both aliases conflict simultaneously → REJECTED with both conflicts
const bothConflict = { ...canonical, metrics: { ...canonicalMetrics } };
bothConflict.metrics.snr = canonicalMetrics.output_fraction + 0.1;
bothConflict.metrics.dev10x = canonicalMetrics.log_leverage + 1.0;
const bothConflictResult = validateEnvelope(bothConflict);
assert(!bothConflictResult.valid,
  "Both aliases conflict: rejected (hard fail)");
assert(bothConflictResult.schemaErrors?.length >= 2,
  "Both aliases conflict: at least 2 conflict errors reported");

// 15. No legacy aliases present → no conflict (regression guard)
const noAlias = { ...canonical, metrics: { ...canonicalMetrics } };
const noAliasResult = validateEnvelope(noAlias);
assert(noAliasResult.valid,
  "No legacy aliases: canonical-only metrics still accepted (regression)");

// Summary
console.log(`\n=== Summary ===\n`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  \u2717 ${f}`);
}
console.log(`\n${failed === 0 ? "ALL ALIAS ACCEPTANCE TESTS PASS" : "ALIAS ACCEPTANCE FAILURES DETECTED"}`);
process.exit(failed === 0 ? 0 : 1);

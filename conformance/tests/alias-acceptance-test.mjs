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

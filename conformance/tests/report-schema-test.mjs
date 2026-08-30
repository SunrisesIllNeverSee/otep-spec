#!/usr/bin/env node
/**
 * conformance/tests/report-schema-test.mjs
 *
 * WS4: Validates that JSON conformance reports produced by tteop-validate.mjs
 * conform to schemas/conformance-report-v0.1.schema.json.
 *
 * Generates:
 *   1. A passing report (from a valid envelope)
 *   2. A failing report (from an invalid envelope)
 *
 * Validates both structurally against the conformance-report schema.
 *
 * License: Apache-2.0
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const SCHEMA_PATH = join(ROOT, "schemas", "conformance-report-v0.1.schema.json");
const VALID_ENVELOPE = join(ROOT, "examples", "complete-valid.json");
const INVALID_ENVELOPE = join(ROOT, "examples", "negative", "08-public-pseudo-cohort.json");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "tteop-report-"));

  // Load the conformance-report schema
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateReport = ajv.compile(schema);

  // 1. Generate a passing report
  console.log("=== Step 1: Generate passing report ===\n");
  const passReportPath = join(tmpDir, "pass-report.json");
  const validEnvelopeClean = JSON.parse(readFileSync(VALID_ENVELOPE, "utf8"));
  writeFileSync(passReportPath, JSON.stringify(validEnvelopeClean, null, 2));

  const passOutput = execSync(
    `node ${join(ROOT, "conformance", "tteop-validate.mjs")} ${passReportPath} --report json`,
    { encoding: "utf8", cwd: ROOT }
  );
  const passReport = JSON.parse(passOutput);

  assert(passReport.overall_result === "pass", "Passing report has overall_result: pass");
  assert(passReport.report_version === "tteop-conformance/0.1-draft", "Passing report has correct report_version");
  assert(passReport.tests.length > 0, "Passing report has tests array");
  assert(passReport.tests.every(t => t.requirement_id), "All tests have requirement_id");

  const passValid = validateReport(passReport);
  assert(passValid, "Passing report validates against conformance-report schema");
  if (!passValid) {
    console.log(`    Schema errors: ${JSON.stringify(validateReport.errors, null, 2)}`);
  }

  // 2. Generate a failing report
  console.log("\n=== Step 2: Generate failing report ===\n");
  const failEnvelopePath = join(tmpDir, "fail-envelope.json");
  const invalidEnvelope = JSON.parse(readFileSync(INVALID_ENVELOPE, "utf8"));
  // Remove fixture metadata
  delete invalidEnvelope._fixture_id;
  delete invalidEnvelope._fixture_description;
  delete invalidEnvelope._expected_rejection;
  writeFileSync(failEnvelopePath, JSON.stringify(invalidEnvelope, null, 2));

  let failReport;
  try {
    const failOutput = execSync(
      `node ${join(ROOT, "conformance", "tteop-validate.mjs")} ${failEnvelopePath} --report json`,
      { encoding: "utf8", cwd: ROOT }
    );
    failReport = JSON.parse(failOutput);
  } catch (e) {
    // The validator exits with code 1 or 2 on failure, but stdout still has the report
    failReport = JSON.parse(e.stdout || e.message);
  }

  assert(failReport.overall_result === "fail", "Failing report has overall_result: fail");
  assert(failReport.tests.some(t => t.result === "fail"), "Failing report records failed tests");

  const failValid = validateReport(failReport);
  assert(failValid, "Failing report validates against conformance-report schema (structurally valid even when tests fail)");
  if (!failValid) {
    console.log(`    Schema errors: ${JSON.stringify(validateReport.errors, null, 2)}`);
  }

  // 3. Verify no undeclared properties
  console.log("\n=== Step 3: No undeclared properties ===\n");
  assert(schema.additionalProperties === false, "Schema has additionalProperties: false");
  assert(passValid && failValid, "Both reports pass schema validation with additionalProperties: false");

  // Summary
  console.log(`\n=== Summary ===\n`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
  }
  console.log(`\n${failed === 0 ? "ALL REPORT TESTS PASS" : "REPORT TEST FAILURES DETECTED"}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();

#!/usr/bin/env node
/**
 * conformance/tests/negative-fixtures.mjs
 *
 * Exercises all 12 negative/adversarial fixtures, proving that the shared
 * validator correctly rejects each one for the expected reason.
 *
 * Uses lib/envelope-validator.mjs — the single source of truth.
 *
 * License: Apache-2.0
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateEnvelope,
  validateEnvelopeSchema,
  validateEnvelopeSemantics,
} from "../../lib/envelope-validator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEG_DIR = join(__dirname, "..", "..", "examples", "negative");

const EXPECTED_REASONS = {
  "01-invalid-datetime": ["date-time", "datetime", "format"],
  "02-oversized-integer": ["maximum", "safe integer", "9007199254740991"],
  "03-negative-count": ["negative", "minimum", ">= 0"],
  "04-non-integer-count": ["integer", "type"],
  "05-nested-provider-field": ["non-scalar", "SRP-VAL-007"],
  "06-array-provider-field": ["non-scalar", "SRP-VAL-007"],
  "07-unknown-property": ["additional", "property"],
  "08-public-pseudo-cohort": ["cohort_id", "SRP-PRIV-002"],
  "09-null-without-flag": ["missingness", "SRP-MISS"],
  "10-signed-valid-status": ["valid", "SRP-PROV-005", "signature"],
  "11-forbidden-top-level": ["forbidden", "SRP-VAL-006"],
  "12-forbidden-in-extension": ["forbidden", "SRP-VAL-006"],
  "13-conflicting-metric-alias": ["conflict", "snr", "output_fraction"],
};

function run() {
  const files = readdirSync(NEG_DIR)
    .filter(f => f.endsWith(".json"))
    .sort();

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const file of files) {
    const fixtureId = file.replace(".json", "");
    const path = join(NEG_DIR, file);
    const envelope = JSON.parse(readFileSync(path, "utf8"));

    // Remove fixture metadata before validation
    const cleanEnvelope = { ...envelope };
    delete cleanEnvelope._fixture_id;
    delete cleanEnvelope._fixture_description;
    delete cleanEnvelope._expected_rejection;

    const result = validateEnvelope(cleanEnvelope, { computeMetrics: false });
    const allErrors = [...result.schemaErrors, ...result.semanticErrors];

    const testId = `NEG-${fixtureId.split("-")[0]}`;
    const description = envelope._fixture_description || fixtureId;
    const expectedKeywords = EXPECTED_REASONS[fixtureId] || [];

    // The fixture MUST be rejected
    if (result.valid) {
      failures.push(`${testId}: FAIL — fixture was accepted but should have been rejected (${description})`);
      failed++;
      continue;
    }

    // The rejection MUST match at least one expected keyword
    const errorText = allErrors.join(" ").toLowerCase();
    const matched = expectedKeywords.some(kw => errorText.includes(kw.toLowerCase()));

    if (!matched) {
      failures.push(`${testId}: FAIL — rejected but error doesn't match expected keywords [${expectedKeywords.join(", ")}]. Errors: ${allErrors.join("; ")}`);
      failed++;
      continue;
    }

    console.log(`  ${testId}: PASS — rejected: "${allErrors[0].substring(0, 80)}..."`);
    passed++;
  }

  console.log(`\nNegative fixtures: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ${f}`);
  }
  return failed === 0;
}

const ok = run();
process.exit(ok ? 0 : 1);

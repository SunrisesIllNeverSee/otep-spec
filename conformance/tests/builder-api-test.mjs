#!/usr/bin/env node
/**
 * conformance/tests/builder-api-test.mjs
 *
 * Conformance coverage for the stable JavaScript builder API
 * (lib/envelope-builder.mjs). Verifies that buildEnvelope produces envelopes
 * that pass the full validator (schema + semantics) across the documented
 * input matrix, and that all documented error conditions throw.
 *
 * License: Apache-2.0
 */

import {
  buildEnvelope,
  buildRecord,
} from "../../lib/envelope-builder.mjs";
import {
  validateEnvelope,
  SPEC_VERSION,
  METRIC_SPEC_VERSION,
  PRIVACY_MODES,
  PROVENANCE_LEVELS,
} from "../../lib/envelope-validator.mjs";

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

function assertThrows(fn, label) {
  try {
    fn();
    failed++;
    failures.push(`${label} (expected throw)`);
    console.log(`  ✗ ${label} — expected throw, none occurred`);
  } catch (e) {
    passed++;
    console.log(`  ✓ ${label} — threw: ${e.message.substring(0, 70)}`);
  }
}

console.log("=== Stable builder API (lib/envelope-builder.mjs) ===\n");

// 1. Full valid envelope (all four pillars) — validates against schema + semantics
const e1 = buildEnvelope(
  { input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 },
  { tool: "claude-code", provider: "anthropic", model: "claude-sonnet-4" },
);
const r1 = validateEnvelope(e1);
assert(r1.valid, "Full envelope: schema + semantic valid");
assert(e1.protocol_version === SPEC_VERSION, `protocol_version is ${SPEC_VERSION}`);
assert(e1.metric_spec_version === METRIC_SPEC_VERSION, `metric_spec_version is ${METRIC_SPEC_VERSION}`);
assert(e1.metrics.yield === 18436.98, "yield matches canonical example (18436.98)");
assert(e1.metrics.leverage === 2042.2, "leverage matches canonical example (2042.2)");
assert(e1.metrics.velocity === 9.028, "velocity matches canonical example (9.028)");
assert(e1.metrics.output_fraction === 0.9003, "output_fraction matches canonical (0.9003)");
assert(e1.metrics.log_leverage === 3.31, "log_leverage matches canonical (3.31)");
assert(!e1.validity, "no validity block when no missingness (clean minimal envelope)");

// 2. Null cache — missingness flags emitted, still valid
const e2 = buildEnvelope(
  { input: 1000, output: 500, cache_write: null, cache_read: null },
  { tool: "test" },
);
const r2 = validateEnvelope(e2);
assert(r2.valid, "Null cache: valid");
assert(e2.validity?.missingness_flags?.includes("cache_write_not_reported"), "cache_write missingness flag");
assert(e2.validity?.missingness_flags?.includes("cache_read_not_reported"), "cache_read missingness flag");
assert(e2.validity?.status === "partial", "validity status is partial");

// 3. Public-pseudonymous + cohort_id → cohort_id nulled (SRP-PRIV-002)
const e3 = buildEnvelope(
  { input: 100, output: 50, cache_write: 10, cache_read: 20 },
  { operator_key: "op_abc", cohort_id: "cohort1", privacy_mode: "public-pseudonymous" },
);
const r3 = validateEnvelope(e3);
assert(r3.valid, "Public-pseudonymous + cohort_id: valid (cohort nulled)");
assert(e3.operator.cohort_id === null, "cohort_id nulled in public-pseudonymous mode");

// 4. Private-managed-cohort + cohort_id → retained
const e4 = buildEnvelope(
  { input: 100, output: 50, cache_write: 10, cache_read: 20 },
  { operator_key: "op_abc", cohort_id: "cohort1", privacy_mode: "private-managed-cohort" },
);
const r4 = validateEnvelope(e4);
assert(r4.valid, "Private-managed-cohort + cohort_id: valid");
assert(e4.operator.cohort_id === "cohort1", "cohort_id retained in private-managed-cohort mode");

// 5. Enterprise-isolated
const e5 = buildEnvelope(
  { input: 100, output: 50, cache_write: 10, cache_read: 20 },
  { operator_key: "op_ent", privacy_mode: "enterprise-isolated" },
);
const r5 = validateEnvelope(e5);
assert(r5.valid, "Enterprise-isolated: valid");

// 6. Provenance levels (table-driven: every supported builder level)
// "signed" is in PROVENANCE_LEVELS but rejected by the builder (SRP-SIG-001);
// it is tested separately in the error-conditions section below.
const BUILDER_PROVENANCE_LEVELS = PROVENANCE_LEVELS.filter((l) => l !== "signed");
for (const level of BUILDER_PROVENANCE_LEVELS) {
  const e = buildEnvelope(
    { input: 100, output: 50, cache_write: 10, cache_read: 20 },
    { provenance_level: level },
  );
  const r = validateEnvelope(e);
  assert(r.valid, `provenance_level=${level}: valid`);
  assert(e.provenance.level === level, `provenance.level is ${level}`);
}

// 6a. Privacy modes (table-driven: every valid privacy mode)
for (const mode of PRIVACY_MODES) {
  const e = buildEnvelope(
    { input: 100, output: 50, cache_write: 10, cache_read: 20 },
    { privacy_mode: mode },
  );
  const r = validateEnvelope(e);
  assert(r.valid, `privacy_mode=${mode}: valid`);
  assert(e.privacy.mode === mode, `privacy.mode is ${mode}`);
}

// 7. buildRecord alias === buildEnvelope (reference equality, not value equality)
// buildRecord is exported as `export const buildRecord = buildEnvelope`, so they
// are the same function object. Comparing serialized output of two separate calls
// is flaky because observation.timestamp uses new Date().toISOString(), which can
// differ across millisecond boundaries.
assert(buildRecord === buildEnvelope, "buildRecord is the same function as buildEnvelope (reference equality)");

// 8. Error conditions
console.log("\n--- Error conditions ---");
assertThrows(() => buildEnvelope({ input: -1, output: 50 }), "negative input throws");
assertThrows(() => buildEnvelope({ input: 100, output: -5 }), "negative output throws");
assertThrows(() => buildEnvelope({ input: 1.5, output: 50 }), "non-integer input throws");
assertThrows(() => buildEnvelope({ input: 100, output: 50, cache_write: -1 }), "negative cache_write throws");
assertThrows(() => buildEnvelope({ input: 100, output: 50, cache_read: 1.5 }), "non-integer cache_read throws");
assertThrows(
  () => buildEnvelope({ input: 9007199254740992, output: 50 }),
  "oversized input (> MAX_SAFE_INTEGER) throws",
);
assertThrows(
  () => buildEnvelope({ input: 100, output: 50 }, { cohort_id: "cohort1" }),
  "cohort_id without operator_key throws",
);
assertThrows(() => buildEnvelope(null), "null telemetry throws");
assertThrows(() => buildEnvelope("not an object"), "string telemetry throws");
assertThrows(
  () => buildEnvelope({ input: 100, output: 50 }, { provenance_level: "signed" }),
  "provenance_level 'signed' throws (no signature input supported, SRP-SIG-001)",
);

// 8a. Invalid privacy_mode values (table-driven)
// Note: null/undefined are nullish and fall back to the default via ??, so they
// are NOT invalid — they produce a valid default-mode envelope. Only non-nullish
// values outside PRIVACY_MODES are rejected.
const INVALID_PRIVACY_MODES = ["anything", "public", "private", "", "PUBLIC-PSEUDONYMOUS", "anonymous"];
for (const mode of INVALID_PRIVACY_MODES) {
  assertThrows(
    () => buildEnvelope({ input: 100, output: 50 }, { privacy_mode: mode }),
    `privacy_mode '${mode}' throws (not a valid TTEOP privacy mode)`,
  );
}

// 8b. Invalid provenance_level values (table-driven, excluding "signed" which has its own error)
// Same nullish note: null/undefined fall back to "self-reported" via ??.
const INVALID_PROVENANCE_LEVELS = ["anything", "verified", "attested", "", "SIGNED", "platform"];
for (const level of INVALID_PROVENANCE_LEVELS) {
  assertThrows(
    () => buildEnvelope({ input: 100, output: 50 }, { provenance_level: level }),
    `provenance_level '${level}' throws (not a valid TTEOP provenance level)`,
  );
}

// 9. Missing required fields
assertThrows(() => buildEnvelope({ output: 50 }), "missing input throws");
assertThrows(() => buildEnvelope({ input: 100 }), "missing output throws");

// 10. Defaults
const e10 = buildEnvelope({ input: 100, output: 50 });
assert(e10.source.tool === "unknown", "default tool is 'unknown'");
assert(e10.privacy.mode === "public-pseudonymous", "default privacy mode is public-pseudonymous");
assert(e10.provenance.level === "self-reported", "default provenance is self-reported");
assert(e10.provenance.signature_status === "unsigned", "default signature_status is unsigned");

// Summary
console.log(`\n=== Summary ===\n`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ${f}`);
}
console.log(
  failed === 0
    ? "\nALL BUILDER API TESTS PASS"
    : `\n${failed} BUILDER API TEST(S) FAILED`,
);
process.exit(failed === 0 ? 0 : 1);

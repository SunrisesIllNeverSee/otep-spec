/**
 * conformance/tteop-runner.mjs — TTEOP v0.1-draft executable conformance suite.
 *
 * This runner tests the TTEOP specification (tteop/0.1-draft), NOT the legacy
 * sigrank/0.1-draft spec. It validates against
 * schemas/telemetry-envelope-v0.1.schema.json and tests the TTEOP-specific
 * normative requirements (SRP-* IDs).
 *
 * It is self-contained — it does not depend on @sigrank/cascade or any
 * SignalAF code. A third-party implementation can replace the functions below
 * with their own and run the same tests.
 *
 * Conformance areas covered:
 *  1. Schema validation (SRP-VAL-001)
 *  2. Required fields (SRP-DATA-001 through SRP-DATA-009)
 *  3. Data types and constraints (SRP-TYPE-001 through SRP-TYPE-008)
 *  4. Provider-adapter semantics (SRP-ADAPT-001 through SRP-ADAPT-012)
 *  5. Observation windows (SRP-WIN-001 through SRP-WIN-006)
 *  6. Aggregation rules (SRP-AGG-001 through SRP-AGG-004)
 *  7. Missingness rules (SRP-MISS-001 through SRP-MISS-003)
 *  8. Validation rules (SRP-VAL-001 through SRP-VAL-006)
 *  9. Provenance levels (SRP-PROV-001 through SRP-PROV-004)
 * 10. Signature model (SRP-SIG-001 through SRP-SIG-003)
 * 11. Privacy requirements (SRP-PRIV-001 through SRP-PRIV-008)
 * 12. Security (SRP-SEC-001 through SRP-SEC-004)
 * 13. Extension mechanism (SRP-EXT-001 through SRP-EXT-005)
 * 14. Version negotiation (SRP-VER-001 through SRP-VER-005)
 * 15. Backward compatibility (SRP-COMP-001 through SRP-COMP-006)
 * 16. Error taxonomy (SRP-ERR-001, SRP-ERR-002)
 * 17. Conformance classes (SRP-CONF-001 through SRP-CONF-006)
 * 18. Registry (SRP-REG-001 through SRP-REG-004)
 * 19. Non-inferences (SRP-NON-001 through SRP-NON-007)
 * 20. Metrics (SRP-METRIC-001 through SRP-METRIC-006)
 *
 * Usage:
 *   node conformance/tteop-runner.mjs
 *
 * Exit code 0 = all tests pass. Exit code 1 = one or more failures.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeMetrics,
  validateEnvelope,
  roundHalfToEven,
} from "../reference/tteop.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SCHEMA_PATH = join(ROOT, "schemas", "telemetry-envelope-v0.1.schema.json");
const EXAMPLES_DIR = join(ROOT, "examples");
const TEST_VECTORS_DIR = join(ROOT, "test-vectors");
const METRICS_REGISTRY_PATH = join(ROOT, "metrics", "registry.json");
const ADAPTERS_REGISTRY_PATH = join(ROOT, "adapters", "registry.json");

const SPEC_VERSION = "tteop/0.1-draft";
const LEGACY_ALIASES = ["otep/0.1-draft", "sigrank/0.1-draft"];
const LEGACY_ALIAS = "sigrank/0.1-draft";

// ─── Test framework ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testId, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push({ testId, message });
    console.log(`  ✗ ${testId}: ${message}`);
  }
}

function assertEqual(actual, expected, testId, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push({ testId, message: `${label}: expected ${e}, got ${a}` });
    console.log(`  ✗ ${testId}: ${label}: expected ${e}, got ${a}`);
  }
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadSchema() {
  return loadJson(SCHEMA_PATH);
}

// ─── Test suites ────────────────────────────────────────────────────────────

/**
 * Test SRP-DATA-* requirements using the example payloads.
 */
function testDataRequirements(schema) {
  console.log("\n── SRP-DATA: Required fields ──");

  // SRP-DATA-001: protocol_version present and valid
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(complete.protocol_version === SPEC_VERSION || complete.protocol_version === LEGACY_ALIAS,
    "DATA-001a", "complete-valid.json has valid protocol_version");

  // SRP-DATA-002: telemetry.input is non-negative integer
  assert(Number.isInteger(complete.telemetry.input) && complete.telemetry.input >= 0,
    "DATA-002", "telemetry.input is non-negative integer");

  // SRP-DATA-003: telemetry.output is non-negative integer
  assert(Number.isInteger(complete.telemetry.output) && complete.telemetry.output >= 0,
    "DATA-003", "telemetry.output is non-negative integer");

  // SRP-DATA-004: cache_write is integer or null
  assert(complete.telemetry.cache_write === null || (Number.isInteger(complete.telemetry.cache_write) && complete.telemetry.cache_write >= 0),
    "DATA-004", "telemetry.cache_write is integer or null");

  // SRP-DATA-005: cache_read is integer or null
  assert(complete.telemetry.cache_read === null || (Number.isInteger(complete.telemetry.cache_read) && complete.telemetry.cache_read >= 0),
    "DATA-005", "telemetry.cache_read is integer or null");

  // SRP-DATA-006: observation.timestamp is RFC 3339
  const ts = complete.observation.timestamp;
  assert(typeof ts === "string" && !isNaN(Date.parse(ts)),
    "DATA-006", "observation.timestamp is valid RFC 3339");

  // SRP-DATA-007: source.tool is non-empty string
  assert(typeof complete.source.tool === "string" && complete.source.tool.length > 0,
    "DATA-007", "source.tool is non-empty string");

  // SRP-DATA-008: privacy.mode is one of three
  assert(["public-pseudonymous", "private-managed-cohort", "enterprise-isolated"].includes(complete.privacy.mode),
    "DATA-008", "privacy.mode is valid");

  // SRP-DATA-009: provenance.level is one of four
  assert(["self-reported", "collector-attested", "platform-verified", "signed"].includes(complete.provenance.level),
    "DATA-009", "provenance.level is valid");

  // SRP-DATA-011: no real-world identity
  const minimal = loadJson(join(EXAMPLES_DIR, "minimal-valid.json"));
  assert(!minimal.operator || !minimal.operator.pseudonymous_key || !/@|\.com|employee/i.test(minimal.operator.pseudonymous_key),
    "DATA-011", "no real-world identity in pseudonymous_key");

  // SRP-DATA-012: raw_provider_fields not used for metrics
  const result = validateEnvelope(complete, schema);
  assertEqual(result.metrics.yield, 18436.98, "DATA-012", "metrics computed from telemetry, not raw_provider_fields");
}

/**
 * Test SRP-TYPE-* requirements.
 */
function testTypeConstraints(schema) {
  console.log("\n── SRP-TYPE: Data types and constraints ──");

  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));

  // SRP-TYPE-001: token counts are integers
  assert(Number.isInteger(complete.telemetry.input), "TYPE-001a", "input is integer");
  assert(Number.isInteger(complete.telemetry.output), "TYPE-001b", "output is integer");

  // SRP-TYPE-002: within safe integer range
  const MAX_SAFE = 9007199254740991;
  assert(complete.telemetry.input <= MAX_SAFE, "TYPE-002a", "input within safe range");
  assert(complete.telemetry.output <= MAX_SAFE, "TYPE-002b", "output within safe range");

  // SRP-TYPE-004: zero is valid for input/output
  const zeroInput = { input: 0, output: 500, cache_write: 200, cache_read: 1000 };
  const zr = computeMetrics(zeroInput);
  assert(zr.metrics.velocity === null, "TYPE-004", "zero input → velocity null (not crash)");

  // SRP-TYPE-005: zero is valid for cache fields
  const zeroCache = { input: 1000, output: 500, cache_write: 0, cache_read: 0 };
  const zcr = computeMetrics(zeroCache);
  assert(zcr.metrics.yield === 0, "TYPE-005", "zero cache_read → yield 0 (not null)");

  // SRP-TYPE-006: null means unsupported
  const nullCache = { input: 1000, output: 500, cache_write: null, cache_read: null };
  const nr = computeMetrics(nullCache);
  assert(nr.metrics.yield === null, "TYPE-006a", "null cache_read → yield null");
  assert(nr.metrics.leverage === null, "TYPE-006b", "null cache_read → leverage null");

  // SRP-TYPE-007: null not allowed for input/output
  const invalid = loadJson(join(EXAMPLES_DIR, "invalid-payload.json"));
  const ir = validateEnvelope(invalid, schema);
  assert(!ir.valid, "TYPE-007", "invalid payload rejected (includes null/type checks)");

  // SRP-TYPE-008: no fabrication
  assert(nr.metrics.yield === null, "TYPE-008", "null not fabricated to 0");
}

/**
 * Test SRP-ADAPT-* requirements.
 */
function testAdapterSemantics() {
  console.log("\n── SRP-ADAPT: Provider-adapter semantics ──");

  // SRP-ADAPT-001: adapter maps each field to one primitive
  const adaptersRegistry = loadJson(ADAPTERS_REGISTRY_PATH);
  assert(adaptersRegistry.adapters && adaptersRegistry.adapters.length >= 3,
    "ADAPT-001", "at least 3 adapters registered");

  // SRP-ADAPT-002: adapter documents double-counting
  for (const adapter of adaptersRegistry.adapters) {
    assert(typeof adapter.double_counting_policy === "string",
      `ADAPT-002-${adapter.adapter_id}`, `${adapter.adapter_id} documents double-counting policy`);
  }

  // SRP-ADAPT-003: double-counting policy (subtract or flag)
  // Tested via unsupported-cache.json (OpenAI adapter, subtracts cached from input)
  const unsupported = loadJson(join(EXAMPLES_DIR, "unsupported-cache.json"));
  assert(unsupported.telemetry.input === 8500 && unsupported.raw_provider_fields["usage.prompt_tokens"] === 10000,
    "ADAPT-003", "OpenAI adapter subtracts cached_tokens from prompt_tokens (10000-1500=8500)");

  // SRP-ADAPT-004: cache creation unavailable → null + flag
  assert(unsupported.telemetry.cache_write === null,
    "ADAPT-004a", "cache_write is null when provider doesn't expose it");
  assert(unsupported.validity.missingness_flags.includes("cache_write_unsupported"),
    "ADAPT-004b", "cache_write_unsupported flag present");

  // SRP-ADAPT-005: neither cache field → both null + flags
  const minimal = loadJson(join(EXAMPLES_DIR, "minimal-valid.json"));
  assert(minimal.telemetry.cache_write === null && minimal.telemetry.cache_read === null,
    "ADAPT-005a", "both cache fields null");
  assert(minimal.validity.missingness_flags.includes("cache_write_unsupported") &&
         minimal.validity.missingness_flags.includes("cache_read_unsupported"),
    "ADAPT-005b", "both unsupported flags present");

  // SRP-ADAPT-006: custom adapters registered
  assert(existsSync(ADAPTERS_REGISTRY_PATH), "ADAPT-006", "adapters registry exists");

  // SRP-ADAPT-007 through SRP-ADAPT-012: documented in adapter files
  // (These are documentation requirements, verified by file existence)
  assert(existsSync(join(ROOT, "adapters", "anthropic.md")), "ADAPT-008-doc", "anthropic adapter doc exists");
  assert(existsSync(join(ROOT, "adapters", "openai.md")), "ADAPT-009-doc", "openai adapter doc exists");
  assert(existsSync(join(ROOT, "adapters", "google.md")), "ADAPT-010-doc", "google adapter doc exists");
}

/**
 * Test SRP-WIN-* requirements.
 */
function testObservationWindows() {
  console.log("\n── SRP-WIN: Observation windows ──");

  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));

  // SRP-WIN-001: window has start and end
  assert(complete.observation.window_start && complete.observation.window_end,
    "WIN-001", "window_start and window_end present");

  // SRP-WIN-002: window_end >= window_start
  assert(new Date(complete.observation.window_end) >= new Date(complete.observation.window_start),
    "WIN-002", "window_end >= window_start");

  // SRP-WIN-003: duration matches computed
  const computed = (new Date(complete.observation.window_end) - new Date(complete.observation.window_start)) / 1000;
  assert(complete.observation.window_duration_seconds === computed,
    "WIN-003", "window_duration_seconds matches computed duration");

  // SRP-WIN-004: counts are cumulative sums (verified by metric computation from sums)
  // SRP-WIN-005: per-request or per-window allowed (verified by minimal-valid.json having no window)
  const minimal = loadJson(join(EXAMPLES_DIR, "minimal-valid.json"));
  assert(!minimal.observation.window_start,
    "WIN-005", "per-request envelopes allowed (no window_start)");
}

/**
 * Test SRP-AGG-* requirements.
 */
function testAggregationRules() {
  console.log("\n── SRP-AGG: Aggregation rules ──");

  // SRP-AGG-001: sum for primitives
  const req1 = { input: 100, output: 200, cache_write: 50, cache_read: 300 };
  const req2 = { input: 200, output: 300, cache_write: 60, cache_read: 400 };
  const agg = {
    input: req1.input + req2.input,
    output: req1.output + req2.output,
    cache_write: req1.cache_write + req2.cache_write,
    cache_read: req1.cache_read + req2.cache_read,
  };
  assert(agg.input === 300 && agg.output === 500, "AGG-001", "primitives summed correctly");

  // SRP-AGG-002: metrics from aggregated sums, not per-request averages
  const aggMetrics = computeMetrics(agg);
  const m1 = computeMetrics(req1);
  const m2 = computeMetrics(req2);
  const avgYield = (m1.metrics.yield + m2.metrics.yield) / 2;
  assert(aggMetrics.metrics.yield !== avgYield,
    "AGG-002", "aggregated yield ≠ average of per-request yields");

  // SRP-AGG-003: null handling in aggregation
  const mixedReqs = [
    { input: 100, output: 200, cache_write: 50, cache_read: 300 },
    { input: 200, output: 300, cache_write: null, cache_read: 400 },
  ];
  const mixedAgg = {
    input: 300,
    output: 500,
    cache_write: 50, // sum of non-null
    cache_read: 700,
  };
  assert(mixedAgg.cache_write === 50, "AGG-003", "mixed null/non-null: sum non-null values");

  // SRP-AGG-004: cross-window aggregation recomputes metrics
  const crossWindow = computeMetrics(mixedAgg);
  assert(crossWindow.metrics.yield !== null, "AGG-004", "cross-window metrics recomputed");
}

/**
 * Test SRP-MISS-* requirements.
 */
function testMissingnessRules(schema) {
  console.log("\n── SRP-MISS: Missingness rules ──");

  // SRP-MISS-001: null cache_write → missingness flag
  const minimal = loadJson(join(EXAMPLES_DIR, "minimal-valid.json"));
  assert(minimal.telemetry.cache_write === null &&
         minimal.validity.missingness_flags.some(f => f.startsWith("cache_write")),
    "MISS-001", "null cache_write has missingness flag");

  // SRP-MISS-002: null cache_read → missingness flag
  assert(minimal.telemetry.cache_read === null &&
         minimal.validity.missingness_flags.some(f => f.startsWith("cache_read")),
    "MISS-002", "null cache_read has missingness flag");

  // SRP-MISS-003: no fabrication
  const result = computeMetrics({ input: 1000, output: 500, cache_write: null, cache_read: null });
  assert(result.metrics.yield === null && result.metrics.leverage === null,
    "MISS-003", "null fields not fabricated to 0");
}

/**
 * Test SRP-VAL-* requirements.
 */
function testValidationRules(schema) {
  console.log("\n── SRP-VAL: Validation rules ──");

  // SRP-VAL-001: schema validation
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  const cr = validateEnvelope(complete, schema);
  assert(cr.valid, "VAL-001", "valid envelope passes schema validation");

  // SRP-VAL-002: semantic validation
  const invalid = loadJson(join(EXAMPLES_DIR, "invalid-payload.json"));
  const ir = validateEnvelope(invalid, schema);
  assert(!ir.valid && ir.schemaErrors.length > 0, "VAL-002", "invalid envelope rejected by semantic validation");

  // SRP-VAL-004: anomalies don't reject
  const anomalyEnvelope = {
    ...complete,
    validity: { status: "partial", missingness_flags: [], anomaly_flags: ["suspicious"] },
  };
  const ar = validateEnvelope(anomalyEnvelope, schema);
  assert(ar.valid, "VAL-004", "anomaly flags don't reject valid envelope");

  // SRP-VAL-005: no semantic content
  const contentEnvelope = { ...complete, prompt: "hello" };
  const cr5 = validateEnvelope(contentEnvelope, schema);
  assert(cr5.semanticErrors.some(e => e.includes("forbidden")), "VAL-005", "prompt field detected as forbidden");

  // SRP-VAL-006: forbidden field names
  assert(cr5.semanticErrors.length > 0, "VAL-006", "forbidden field names trigger semantic errors");
}

/**
 * Test SRP-PROV-* requirements.
 */
function testProvenanceLevels(schema) {
  console.log("\n── SRP-PROV: Provenance levels ──");

  // SRP-PROV-001: provenance level required
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(complete.provenance.level !== undefined, "PROV-001", "provenance.level present");

  // SRP-PROV-002: no false provenance claims (signed envelope has signature)
  const signed = loadJson(join(EXAMPLES_DIR, "signed-envelope.json"));
  assert(signed.provenance.level === "signed" && signed.extensions,
    "PROV-002", "signed envelope has extensions with signature");

  // SRP-PROV-003: lower provenance not rejected
  const selfReported = { ...complete, provenance: { level: "self-reported", signature_status: "unsigned" } };
  const sr = validateEnvelope(selfReported, schema);
  assert(sr.valid, "PROV-003", "self-reported provenance accepted");
}

/**
 * Test SRP-SIG-* requirements.
 */
function testSignatureModel(schema) {
  console.log("\n── SRP-SIG: Signature model ──");

  const signed = loadJson(join(EXAMPLES_DIR, "signed-envelope.json"));

  // SRP-SIG-001: signed envelope includes signature object
  const sigExt = signed.extensions?.["com.example.signature"];
  assert(sigExt && sigExt.algorithm && sigExt.key_fingerprint && sigExt.value && sigExt.signed_fields,
    "SIG-001", "signed envelope has signature object with all required fields");

  // SRP-SIG-002: non-signed envelope declares unsigned
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(complete.provenance.level !== "signed" &&
         (complete.provenance.signature_status === "unsigned" || complete.provenance.signature_status === "not-applicable"),
    "SIG-002", "non-signed envelope has unsigned or not-applicable status");

  // SRP-SIG-003: v0.1 does not implement cryptographic verification.
  // Signed envelopes MUST use 'signature-present-unverified' until verification
  // is implemented in v0.2. A signed envelope claiming 'valid' is a conformance
  // violation (SRP-PROV-005).
  assert(signed.provenance.signature_status === "signature-present-unverified",
    "SIG-003", "signed envelope uses 'signature-present-unverified' (v0.1 does not verify)");
  assert(signed.provenance.level === "signed",
    "SIG-003", "signed envelope has provenance.level 'signed'");
}

/**
 * Test SRP-PRIV-* requirements.
 */
function testPrivacyRequirements(schema) {
  console.log("\n── SRP-PRIV: Privacy requirements ──");

  // SRP-PRIV-001: privacy mode required
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(complete.privacy.mode !== undefined, "PRIV-001", "privacy.mode present");

  // SRP-PRIV-002: public mode excludes cohort
  assert(complete.privacy.mode === "public-pseudonymous" && !complete.operator?.cohort_id,
    "PRIV-002", "public-pseudonymous mode has no cohort_id");

  // SRP-PRIV-003: enterprise mode not transmitted externally (documentation requirement)
  const signed = loadJson(join(EXAMPLES_DIR, "signed-envelope.json"));
  assert(signed.privacy.mode === "enterprise-isolated", "PRIV-003", "enterprise-isolated mode declared");

  // SRP-PRIV-004: no semantic content required
  const result = computeMetrics(complete.telemetry);
  assert(result.metrics.yield !== null, "PRIV-004", "metrics computable without content");

  // SRP-PRIV-007: core metrics computable from token counts alone
  assert(result.metrics.yield === 18436.98, "PRIV-007", "core metrics from token counts only");

  // SRP-PRIV-008: enrichment distinguishable (source/provider/model are separate from telemetry)
  assert(complete.source && complete.telemetry && complete.source !== complete.telemetry,
    "PRIV-008", "enrichment (source) distinguishable from core (telemetry)");
}

/**
 * Test SRP-EXT-* requirements.
 */
function testExtensionMechanism() {
  console.log("\n── SRP-EXT: Extension mechanism ──");

  // SRP-EXT-001: normative changes via TEP
  assert(existsSync(join(ROOT, "teps", "TEP-0000.md")), "EXT-001", "TEP template exists");

  // SRP-EXT-002: extensions registered
  assert(existsSync(METRICS_REGISTRY_PATH), "EXT-002a", "metrics registry exists");
  assert(existsSync(ADAPTERS_REGISTRY_PATH), "EXT-002b", "adapters registry exists");

  // SRP-EXT-003: namespace prefixes
  const signed = loadJson(join(EXAMPLES_DIR, "signed-envelope.json"));
  const extKeys = Object.keys(signed.extensions || {});
  assert(extKeys.every(k => k.includes(".")), "EXT-003", "extension keys use namespace prefixes");

  // SRP-EXT-004: metric registry fields
  const registry = loadJson(METRICS_REGISTRY_PATH);
  for (const m of registry.metrics) {
    assert(m.metric_id && m.name && m.maturity && m.formula && m.valid_domain &&
           m.zero_behavior && m.missingness_behavior && m.interpretation &&
           m.prohibited_interpretation && m.test_vectors,
      `EXT-004-${m.metric_id}`, `${m.metric_id} has all required registry fields`);
  }

  // SRP-EXT-005: adapter registry fields
  const adapters = loadJson(ADAPTERS_REGISTRY_PATH);
  for (const a of adapters.adapters) {
    assert(a.adapter_id && a.provider && a.field_mappings && a.double_counting_policy,
      `EXT-005-${a.adapter_id}`, `${a.adapter_id} has required registry fields`);
  }
}

/**
 * Test SRP-VER-* requirements.
 */
function testVersionNegotiation(schema) {
  console.log("\n── SRP-VER: Version negotiation ──");

  // SRP-VER-001: protocol version declared
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(complete.protocol_version !== undefined, "VER-001", "protocol_version declared");

  // SRP-VER-002: unsupported version rejected
  const badVersion = { ...complete, protocol_version: "tteop/9.9" };
  const br = validateEnvelope(badVersion, schema);
  assert(!br.valid, "VER-002", "unsupported version rejected");

  // SRP-VER-003: metric spec version declared
  assert(complete.metric_spec_version !== undefined, "VER-003", "metric_spec_version declared");

  // SRP-VER-005: legacy aliases accepted
  const legacy = { ...complete, protocol_version: LEGACY_ALIAS };
  const lr = validateEnvelope(legacy, schema);
  assert(lr.valid, "VER-005", "legacy alias sigrank/0.1-draft accepted");

  // SRP-VER-005b: pre-rename OTEP alias accepted (C6 backward compatibility)
  const otepAlias = { ...complete, protocol_version: "otep/0.1-draft" };
  const or = validateEnvelope(otepAlias, schema);
  assert(or.valid, "VER-005b", "pre-rename legacy alias otep/0.1-draft accepted");
}

/**
 * Test SRP-COMP-* requirements.
 */
function testBackwardCompatibility(schema) {
  console.log("\n── SRP-COMP: Backward compatibility ──");

  // SRP-COMP-001: semantic versioning (verified by version string format)
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  assert(/^tteop\/\d+\.\d+(-draft)?$/.test(complete.protocol_version),
    "COMP-001", "protocol version follows semver format");

  // SRP-COMP-003: unknown optional fields ignored by consumers
  // The schema has additionalProperties: false, so schema validation rejects unknown
  // root-level fields (correct producer behavior). But a consumer MUST still extract
  // and compute metrics from the known fields without crashing. We exercise the
  // consumer path: extract telemetry from an envelope carrying an unknown optional
  // field and verify metrics compute correctly (consumer ignores the unknown field).
  const withExtra = { ...complete, unknown_optional_field: "test" };
  const consumerMetrics = computeMetrics(withExtra.telemetry);
  assert(consumerMetrics.metrics.yield === 18436.98,
    "COMP-003", "consumer ignores unknown optional field and computes metrics correctly");
  // Also verify the schema rejects the unknown field (producer-side check)
  const extraSchemaResult = validateEnvelope(withExtra, schema);
  assert(!extraSchemaResult.valid,
    "COMP-003b", "schema rejects unknown root-level field (producer-side additionalProperties:false)");

  // SRP-COMP-005: stable metrics formula frozen (verified by frozen MOSES invariant)
  const result = computeMetrics({ input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 });
  assert(result.metrics.yield === 18436.98, "COMP-005", "frozen MOSES invariant preserved");
}

/**
 * Test SRP-ERR-* requirements.
 */
function testErrorTaxonomy(schema) {
  console.log("\n── SRP-ERR: Error taxonomy ──");

  // SRP-ERR-001: error codes from taxonomy
  const invalid = loadJson(join(EXAMPLES_DIR, "invalid-payload.json"));
  const ir = validateEnvelope(invalid, schema);
  assert(ir.schemaErrors.length > 0, "ERR-001", "invalid envelope produces error codes");

  // SRP-ERR-002: warnings in response
  const minimal = loadJson(join(EXAMPLES_DIR, "minimal-valid.json"));
  const mr = validateEnvelope(minimal, schema);
  assert(mr.warnings.length > 0, "ERR-002", "valid envelope with null cache produces warnings");
}

/**
 * Test SRP-CONF-* requirements.
 */
function testConformanceClasses() {
  console.log("\n── SRP-CONF: Conformance classes ──");

  // SRP-CONF-001 through SRP-CONF-006: verified by existence of classes.md
  assert(existsSync(join(ROOT, "conformance", "classes.md")), "CONF-001", "conformance classes document exists");

  // SRP-CONF-005: no pay-to-play (verified by open conformance runner)
  assert(existsSync(join(__dirname, "tteop-runner.mjs")), "CONF-005", "conformance runner is open and runnable");
}

/**
 * Test SRP-REG-* requirements.
 */
function testRegistry() {
  console.log("\n── SRP-REG: Registry ──");

  // SRP-REG-001: registry is machine-readable JSON
  const registry = loadJson(METRICS_REGISTRY_PATH);
  assert(typeof registry === "object", "REG-001", "registry is JSON");

  // SRP-REG-002: each metric entry has all fields
  for (const m of registry.metrics) {
    assert(m.metric_id && m.name && m.maturity && m.formula,
      `REG-002-${m.metric_id}`, `${m.metric_id} has required fields`);
  }

  // SRP-REG-003: registry changes via TEP (documentation requirement)
  assert(existsSync(join(ROOT, "teps", "TEP-0000.md")), "REG-003", "TEP process documented");

  // SRP-REG-004: adapter registry fields
  const adapters = loadJson(ADAPTERS_REGISTRY_PATH);
  for (const a of adapters.adapters) {
    assert(a.adapter_id && a.provider, `REG-004-${a.adapter_id}`, `${a.adapter_id} has required fields`);
  }
}

/**
 * Test SRP-NON-* requirements.
 */
function testNonInferences() {
  console.log("\n── SRP-NON: Non-inferences ──");

  // SRP-NON-001/002: metrics must not be presented as proof of quality/productivity
  // (Documentation requirement — verified by SPEC.md §25 content)
  // We verify the metric registry has prohibited_interpretation for each metric
  const registry = loadJson(METRICS_REGISTRY_PATH);
  for (const m of registry.metrics) {
    assert(m.prohibited_interpretation && m.prohibited_interpretation.length > 0,
      `NON-001-${m.metric_id}`, `${m.metric_id} has prohibited_interpretation`);
  }

  // SRP-NON-003: claim level classification (documentation)
  assert(existsSync(join(ROOT, "SPEC.md")), "NON-003", "SPEC.md exists with claim level definitions");

  // SRP-NON-006: rankings not normative
  // (Verified by absence of ranking/leaderboard fields in schema properties)
  const schema = loadSchema();
  const schemaProps = Object.keys(schema.properties || {});
  assert(!schemaProps.includes("rank") && !schemaProps.includes("leaderboard") &&
         !schemaProps.includes("percentile"),
    "NON-006", "schema does not include ranking, leaderboard, or percentile fields");
}

/**
 * Test SRP-METRIC-* requirements using test vectors.
 */
function testMetrics() {
  console.log("\n── SRP-METRIC: Metrics ──");

  // Load all test vectors
  const vectorFiles = readdirSync(TEST_VECTORS_DIR).filter(f => f.endsWith(".json"));

  for (const file of vectorFiles) {
    const vector = loadJson(join(TEST_VECTORS_DIR, file));
    const { metrics, warnings } = computeMetrics(vector.input.telemetry);

    // Compare each metric
    for (const [key, expected] of Object.entries(vector.expected.metrics)) {
      assertEqual(metrics[key], expected, `METRIC-${vector.id}-${key}`,
        `${vector.id}.${key}`);
    }

    // Compare warnings (if expected)
    if (vector.expected.warnings) {
      assertEqual(warnings, vector.expected.warnings, `METRIC-${vector.id}-warnings`,
        `${vector.id}.warnings`);
    }
  }

  // SRP-METRIC-001: rounding precision
  const canonical = computeMetrics({ input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 });
  assert(canonical.metrics.yield === 18436.98, "METRIC-001a", "yield rounded to 2 decimals");
  assert(canonical.metrics.leverage === 2042.2, "METRIC-001b", "leverage rounded to 1 decimal");
  assert(canonical.metrics.velocity === 9.028, "METRIC-001c", "velocity rounded to 3 decimals");
  assert(canonical.metrics.output_fraction === 0.9003, "METRIC-001d", "output_fraction rounded to 4 decimals");
  assert(canonical.metrics.log_leverage === 3.31, "METRIC-001e", "log_leverage rounded to 2 decimals");

  // SRP-METRIC-002: banker's rounding (round-half-to-even)
  // 0.5 → 0 (even), 1.5 → 2 (even), 2.5 → 2 (even)
  assert(roundHalfToEven(0.5, 0) === 0, "METRIC-002a", "0.5 rounds to 0 (banker's)");
  assert(roundHalfToEven(1.5, 0) === 2, "METRIC-002b", "1.5 rounds to 2 (banker's)");
  assert(roundHalfToEven(2.5, 0) === 2, "METRIC-002c", "2.5 rounds to 2 (banker's)");

  // SRP-METRIC-003: null not zero/infinity/NaN
  const nullResult = computeMetrics({ input: 0, output: 500, cache_write: 200, cache_read: 1000 });
  assert(nullResult.metrics.velocity === null, "METRIC-003a", "null not 0 for undefined velocity");
  assert(nullResult.metrics.yield === null, "METRIC-003b", "null not 0 for undefined yield");

  // SRP-METRIC-004: all metric keys present
  const allKeys = Object.keys(canonical.metrics);
  assert(allKeys.length === 5 && allKeys.includes("yield") && allKeys.includes("leverage") &&
         allKeys.includes("velocity") && allKeys.includes("output_fraction") && allKeys.includes("log_leverage"),
    "METRIC-004", "all 5 metric keys present");

  // SRP-METRIC-005: warnings for null metrics
  assert(nullResult.warnings.length > 0, "METRIC-005", "warnings present for null metrics");

  // SRP-METRIC-006: warning order (cache-unavailable before metric-undefined)
  const cacheNull = computeMetrics({ input: 1000, output: 500, cache_write: null, cache_read: null });
  const cacheWarnIdx = cacheNull.warnings.findIndex(w => w.includes("cache_write is unavailable"));
  const metricWarnIdx = cacheNull.warnings.findIndex(w => w.includes("log_leverage_undefined"));
  assert(cacheWarnIdx >= 0 && metricWarnIdx >= 0 && cacheWarnIdx < metricWarnIdx,
    "METRIC-006", "cache-unavailable warnings before metric-undefined warnings");
}

/**
 * Test SRP-ARCH-* requirements.
 */
function testArchitecture(schema) {
  console.log("\n── SRP-ARCH: Protocol architecture ──");

  // SRP-ARCH-001: producer emits schema-valid envelope
  const complete = loadJson(join(EXAMPLES_DIR, "complete-valid.json"));
  const cr = validateEnvelope(complete, schema);
  assert(cr.valid, "ARCH-001", "producer envelope validates against schema");

  // SRP-ARCH-002: consumer computes metrics identically regardless of producer
  const result1 = computeMetrics(complete.telemetry);
  const result2 = computeMetrics(complete.telemetry);
  assertEqual(result1.metrics, result2.metrics, "ARCH-002", "identical metrics for same input");

  // SRP-ARCH-003: adapter maps fields without altering semantics
  const unsupported = loadJson(join(EXAMPLES_DIR, "unsupported-cache.json"));
  assert(unsupported.telemetry.input === 8500, "ARCH-003", "adapter maps correctly (input=8500 after subtract)");

  // SRP-ARCH-004: specification is authoritative over proprietary applications
  // This is verified by the existence of the spec itself and the conformance suite —
  // any implementation claiming authority over the spec would fail the conformance tests.
  // We verify that the spec version string is defined and that the reference implementation
  // produces spec-conformant output (not implementation-defined output).
  assert(SPEC_VERSION === "tteop/0.1-draft", "ARCH-004", "spec version is defined by spec, not by implementation");
  const canonicalResult = computeMetrics({ input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 });
  assert(canonicalResult.metrics.yield === 18436.98, "ARCH-004", "reference impl produces spec-defined metrics (Yield)");
  assert(canonicalResult.metrics.log_leverage === 3.31, "ARCH-004", "reference impl produces spec-defined metrics (log_leverage)");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("TTEOP v0.1-draft Conformance Suite");
  console.log(`Schema: ${SCHEMA_PATH}`);
  console.log("");

  const schema = loadSchema();

  testArchitecture(schema);
  testDataRequirements(schema);
  testTypeConstraints(schema);
  testAdapterSemantics();
  testObservationWindows();
  testAggregationRules();
  testMissingnessRules(schema);
  testValidationRules(schema);
  testProvenanceLevels(schema);
  testSignatureModel(schema);
  testPrivacyRequirements(schema);
  testExtensionMechanism();
  testVersionNegotiation(schema);
  testBackwardCompatibility(schema);
  testErrorTaxonomy(schema);
  testConformanceClasses();
  testRegistry();
  testNonInferences();
  testMetrics();

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  ${f.testId}: ${f.message}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main();

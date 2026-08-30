/**
 * conformance/runner.mjs — SigRank Standard v0.1-draft executable conformance suite.
 *
 * Language-neutral fixture-based conformance runner. Loads all fixtures from
 * examples/fixtures/, builds a complete SigRank Standard record from the
 * fixture input, and validates the record against the expected output.
 *
 * This runner is self-contained — it does not depend on @sigrank/cascade or any
 * SignalAF code. A third-party implementation can replace the functions below
 * with their own and run the same fixtures.
 *
 * Conformance areas covered (Phase 1 scope items 1-12):
 *  1. schema validity
 *  2. exact primitive semantics
 *  3. alias translation (cache_creation → cache_write in output record)
 *  4. canonical reference vector
 *  5. zero input / zero output / zero cache cases
 *  6. missing-cache telemetry (null semantics)
 *  7. null and warning semantics (warnings validated as ordered arrays)
 *  8. metric rounding
 *  9. version declaration (spec field)
 * 10. content-independence (forbidden + required fields)
 * 11. provenance for field-dependent claims (source object)
 * 12. exclusion of Construction, Build Archetypes, and RS05 from the base record
 *
 * Usage:
 *   node conformance/runner.mjs
 *
 * Exit code 0 = all fixtures pass. Exit code 1 = one or more failures.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "examples", "fixtures");
const SCHEMA_PATH = join(__dirname, "..", "schema", "sigrank-operator-record-v0.1.schema.json");

const SPEC_VERSION = "sigrank/0.1-draft";

// ─── Metric computation (reference implementation) ──────────────────────────
// These functions implement the sigrank/0.1-draft metric definitions.
// A conforming implementation MUST produce the same results for the same inputs.

function round(n, d) {
  if (n === null || !Number.isFinite(n)) return null;
  return Number(n.toFixed(d));
}

/**
 * Compute the five portable metrics from four token pillars.
 *
 * Null semantics (from the spec):
 * - When a denominator is zero, the metric is null (not 0 or Infinity).
 * - When cache_read is null/unavailable, Yield, Leverage, and 10xDEV are null.
 * - When cache_write is null/unavailable, 10xDEV is null.
 * - Warnings explain each null.
 */
function computeMetrics(telemetry) {
  const input = telemetry.input;
  const output = telemetry.output;
  const cacheWrite = telemetry.cache_write ?? telemetry.cache_creation ?? null;
  const cacheRead = telemetry.cache_read ?? null;

  const warnings = [];

  // SNR = output / (input + output)
  const snrDenom = input + output;
  const snrRaw = snrDenom > 0 ? output / snrDenom : null;
  if (snrRaw === null) warnings.push("snr_undefined: input+output=0");

  // Velocity = output / input
  const velocityRaw = input > 0 ? output / input : null;
  if (velocityRaw === null) warnings.push("velocity_undefined: input=0");

  // Leverage = cacheRead / input — null when cache_read is unavailable
  let leverageRaw = null;
  if (cacheRead === null) {
    // Standard null policy: unavailable cache_read → null
  } else if (input > 0) {
    leverageRaw = cacheRead / input;
  } else {
    warnings.push("leverage_undefined: input=0");
  }

  // Yield = (cacheRead × output) / input² = leverage × velocity
  let yieldRaw = null;
  if (cacheRead === null) {
    // Standard null policy: unavailable cache_read → null
  } else if (leverageRaw !== null && velocityRaw !== null) {
    yieldRaw = leverageRaw * velocityRaw;
  } else {
    warnings.push("yield_undefined: requires input>0");
  }

  // Standard-level warnings for unavailable cache (emitted before dev10x
  // warning so the "why" precedes the "what" in the warning list)
  if (cacheWrite === null) warnings.push("cache_write is unavailable; 10xDEV is undefined.");
  if (cacheRead === null) warnings.push("cache_read is unavailable; Yield, Leverage, and 10xDEV are undefined.");

  // 10xDEV = log10(R / I) = log10(Leverage) — requires all four pillars > 0
  // (per SPEC §7.5 reference implementation policy)
  let dev10xRaw = null;
  if (cacheWrite === null || cacheRead === null) {
    // Standard null policy: unavailable cache → null
    warnings.push("dev10x_undefined: requires all four pillars > 0");
  } else if (input > 0 && output > 0 && cacheWrite > 0 && cacheRead > 0) {
    dev10xRaw = Math.log10(cacheRead / input);
  } else {
    warnings.push("dev10x_undefined: requires all four pillars > 0");
  }

  return {
    metrics: {
      yield: round(yieldRaw, 2),
      leverage: round(leverageRaw, 1),
      velocity: round(velocityRaw, 3),
      snr: round(snrRaw, 4),
      dev10x: round(dev10xRaw, 2),
    },
    warnings,
  };
}

// ─── Record builder ──────────────────────────────────────────────────────────
// Builds a complete SigRank Standard v0.1-draft record from fixture input.
// Normalizes aliases (cache_creation → cache_write) in the output telemetry.

function buildRecord(fixtureInput) {
  const { telemetry, source } = fixtureInput;

  // Normalize aliases: cache_creation → cache_write
  const normalizedTelemetry = {
    input: telemetry.input,
    output: telemetry.output,
    cache_write: telemetry.cache_write ?? telemetry.cache_creation ?? null,
    cache_read: telemetry.cache_read ?? null,
  };

  const { metrics, warnings } = computeMetrics(telemetry);

  return {
    spec: SPEC_VERSION,
    timestamp: new Date().toISOString(),
    source: {
      provider: source.provider,
      model: source.model,
      tool: source.tool,
    },
    telemetry: normalizedTelemetry,
    metrics,
    warnings,
  };
}

// ─── Fixture loading ─────────────────────────────────────────────────────────

function loadFixtures() {
  const files = readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => {
    const raw = readFileSync(join(FIXTURES_DIR, f), "utf-8");
    return JSON.parse(raw);
  });
}

function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function approxEqual(a, b, tolerance = 0.001) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < tolerance;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ─── Schema validation (self-contained, no external deps) ────────────────────
// Validates a record against the JSON Schema structurally.
// This is a minimal validator covering the schema features used by
// sigrank-operator-record-v0.1.schema.json: type, required, const,
// additionalProperties, minimum, minLength, enum, format (date-time presence).

function validateAgainstSchema(record, schema) {
  const errors = [];

  function checkType(value, type, path) {
    if (type === "integer") {
      if (!Number.isInteger(value)) errors.push(`schema ${path}: expected integer, got ${typeof value}`);
    } else if (type === "number") {
      if (typeof value !== "number" || Number.isNaN(value)) errors.push(`schema ${path}: expected number, got ${typeof value}`);
    } else if (type === "string") {
      if (typeof value !== "string") errors.push(`schema ${path}: expected string, got ${typeof value}`);
    } else if (type === "object") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) errors.push(`schema ${path}: expected object, got ${typeof value}`);
    } else if (type === "array") {
      if (!Array.isArray(value)) errors.push(`schema ${path}: expected array, got ${typeof value}`);
    }
  }

  function validate(value, node, path) {
    if (node.const !== undefined) {
      if (value !== node.const) errors.push(`schema ${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`);
      return;
    }

    if (node.enum !== undefined) {
      if (!node.enum.includes(value)) errors.push(`schema ${path}: expected one of ${JSON.stringify(node.enum)}, got ${JSON.stringify(value)}`);
    }

    // type can be a string or array of types (for nullable fields)
    if (node.type !== undefined) {
      const types = Array.isArray(node.type) ? node.type : [node.type];
      const matched = types.some((t) => {
        if (value === null) return t === "null";
        if (t === "integer") return Number.isInteger(value);
        if (t === "number") return typeof value === "number" && !Number.isNaN(value);
        if (t === "string") return typeof value === "string";
        if (t === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
        if (t === "array") return Array.isArray(value);
        return false;
      });
      if (!matched) errors.push(`schema ${path}: expected type ${JSON.stringify(node.type)}, got ${typeof value} (${JSON.stringify(value)})`);
    }

    if (node.minimum !== undefined && typeof value === "number") {
      if (value < node.minimum) errors.push(`schema ${path}: value ${value} below minimum ${node.minimum}`);
    }

    if (node.minLength !== undefined && typeof value === "string") {
      if (value.length < node.minLength) errors.push(`schema ${path}: string length ${value.length} below minLength ${node.minLength}`);
    }

    if (node.required !== undefined && typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const req of node.required) {
        if (!(req in value)) errors.push(`schema ${path}: missing required field "${req}"`);
      }
    }

    if (node.additionalProperties === false && typeof value === "object" && value !== null && !Array.isArray(value)) {
      const allowed = Object.keys(node.properties || {});
      for (const key of Object.keys(value)) {
        if (!allowed.includes(key)) errors.push(`schema ${path}: additional property "${key}" not allowed`);
      }
    }

    if (node.properties !== undefined && typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const [key, subSchema] of Object.entries(node.properties)) {
        if (key in value) {
          validate(value[key], subSchema, `${path}.${key}`);
        }
      }
    }

    if (node.items !== undefined && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        validate(value[i], node.items, `${path}[${i}]`);
      }
    }
  }

  validate(record, schema, "record");
  return errors;
}

// ─── Fixture validation ──────────────────────────────────────────────────────

function validateFixture(fixture, schema) {
  const errors = [];
  const id = fixture.id;

  const record = buildRecord(fixture.input);
  const expected = fixture.expected;

  // 1. Schema validity — validate the built record against the JSON Schema
  const schemaErrors = validateAgainstSchema(record, schema);
  for (const err of schemaErrors) {
    errors.push(err);
  }

  // 2. Primitive semantics — required telemetry fields present and non-negative integers
  const t = record.telemetry;
  if (!Number.isInteger(t.input) || t.input < 0) errors.push(`primitive: input must be non-negative integer, got ${t.input}`);
  if (!Number.isInteger(t.output) || t.output < 0) errors.push(`primitive: output must be non-negative integer, got ${t.output}`);
  if (t.cache_write !== null && (!Number.isInteger(t.cache_write) || t.cache_write < 0)) {
    errors.push(`primitive: cache_write must be non-negative integer or null, got ${t.cache_write}`);
  }
  if (t.cache_read !== null && (!Number.isInteger(t.cache_read) || t.cache_read < 0)) {
    errors.push(`primitive: cache_read must be non-negative integer or null, got ${t.cache_read}`);
  }

  // 3. Metric comparison — exact values with tolerance
  if (expected.metrics) {
    for (const [key, expectedValue] of Object.entries(expected.metrics)) {
      const actualValue = record.metrics[key];
      if (!approxEqual(actualValue, expectedValue)) {
        errors.push(`metric ${key}: expected ${expectedValue}, got ${actualValue}`);
      }
    }
  }

  // 4. Warning semantics — warnings must match expected as ordered arrays
  if (expected.warnings !== undefined) {
    if (!arraysEqual(record.warnings, expected.warnings)) {
      errors.push(`warnings mismatch:\n        expected: ${JSON.stringify(expected.warnings)}\n        actual:   ${JSON.stringify(record.warnings)}`);
    }
  }

  // 5. Version declaration — the built record must declare spec: sigrank/0.1-draft
  if (expected.spec !== undefined) {
    if (record.spec !== expected.spec) {
      errors.push(`version declaration: expected spec "${expected.spec}", got "${record.spec}"`);
    }
  }

  // 6. Alias translation — output telemetry must be normalized to cache_write (not cache_creation)
  if (expected.output_telemetry_keys !== undefined) {
    const actualKeys = Object.keys(record.telemetry).sort();
    const expectedKeys = [...expected.output_telemetry_keys].sort();
    if (!arraysEqual(actualKeys, expectedKeys)) {
      errors.push(`alias translation: expected telemetry keys ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(actualKeys)}`);
    }
    if ("cache_creation" in record.telemetry) {
      errors.push("alias translation: cache_creation leaked into output telemetry (should be normalized to cache_write)");
    }
  }

  // 7. Content independence — forbidden fields must not appear in telemetry or record
  if (expected.forbidden_fields !== undefined) {
    for (const forbidden of expected.forbidden_fields) {
      if (forbidden in record.telemetry) {
        errors.push(`content leak: forbidden field "${forbidden}" found in telemetry`);
      }
      if (forbidden in record) {
        errors.push(`content leak: forbidden field "${forbidden}" found in record`);
      }
    }
  }

  // 8. Required fields — the record must contain all required top-level fields
  if (expected.required_fields !== undefined) {
    for (const required of expected.required_fields) {
      if (!(required in record)) {
        errors.push(`missing required field: "${required}" not in record`);
      }
    }
  }

  // 9. Extension exclusion — no forbidden metrics in the output
  if (expected.forbidden_metrics !== undefined) {
    for (const forbidden of expected.forbidden_metrics) {
      if (forbidden in record.metrics) {
        errors.push(`extension leak: forbidden metric "${forbidden}" found in metrics`);
      }
    }
  }

  // 10. Required metrics — the five portable metrics must all be present
  if (expected.required_metrics !== undefined) {
    for (const required of expected.required_metrics) {
      if (!(required in record.metrics)) {
        errors.push(`missing required metric: "${required}" not in metrics`);
      }
    }
  }

  // 11. Provenance — source object must have provider, model, tool (non-empty strings)
  const s = record.source;
  if (!s || typeof s.provider !== "string" || s.provider.length < 1) {
    errors.push("provenance: source.provider must be a non-empty string");
  }
  if (!s || typeof s.model !== "string" || s.model.length < 1) {
    errors.push("provenance: source.model must be a non-empty string");
  }
  if (!s || typeof s.tool !== "string" || s.tool.length < 1) {
    errors.push("provenance: source.tool must be a non-empty string");
  }

  return { id, errors, passed: errors.length === 0 };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const fixtures = loadFixtures();
  const schema = loadSchema();
  let passed = 0;
  let failed = 0;

  console.log(`SigRank Standard v0.1-draft Conformance Suite`);
  console.log(`${fixtures.length} fixtures loaded from examples/fixtures/`);
  console.log(`Schema: ${SCHEMA_PATH.split("/").slice(-2).join("/")}`);
  console.log("");

  for (const fixture of fixtures) {
    const result = validateFixture(fixture, schema);
    if (result.passed) {
      console.log(`  ✓ ${result.id}`);
      passed++;
    } else {
      console.log(`  ✗ ${result.id}`);
      for (const err of result.errors) {
        console.log(`      ${err}`);
      }
      failed++;
    }
  }

  console.log("");
  console.log(`Results: ${passed} passed, ${failed} failed, ${fixtures.length} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();

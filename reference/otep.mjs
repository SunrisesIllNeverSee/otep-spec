/**
 * reference/otep.mjs — OTEP v0.1-draft reference implementation.
 *
 * This is the reference implementation for the Operator Token Efficiency
 * Protocol. It is normative only insofar as it demonstrates conformity with
 * SPEC.md; it does not silently define undocumented behavior.
 *
 * Two modes:
 *   - `validate`  — validate a telemetry envelope against the OTEP schema and
 *                    semantic rules, then compute metrics if valid.
 *   - `compute`   — compute the five registered metrics from a telemetry
 *                    object (input, output, cache_write, cache_read).
 *
 * Usage:
 *   node reference/otep.mjs validate <envelope.json>
 *   node reference/otep.mjs compute  <telemetry.json>
 *   node reference/otep.mjs compute-inline <input> <output> <cache_write> <cache_read>
 *
 * Exit codes:
 *   0 — success (valid envelope or metrics computed)
 *   1 — invalid envelope (schema or semantic errors)
 *   2 — usage error
 *
 * License: Apache-2.0
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SPEC_VERSION = "otep/0.1-draft";
const METRIC_SPEC_VERSION = "otep-metrics/0.1-draft";
const SCHEMA_PATH = join(__dirname, "..", "schemas", "telemetry-envelope-v0.1.schema.json");

const FORBIDDEN_FIELDS = [
  "prompt", "prompt_text", "completion", "completion_text", "response_text",
  "source_code", "code", "diff", "keystrokes", "screen_content",
  "file_path", "file_content", "repo_content",
];

const PRIVACY_MODES = ["public-pseudonymous", "private-managed-cohort", "enterprise-isolated"];
const PROVENANCE_LEVELS = ["self-reported", "collector-attested", "platform-verified", "signed"];

// ─── Banker's rounding (round-half-to-even) ─────────────────────────────────
// SPEC.md SRP-METRIC-002 requires round-half-to-even, NOT toFixed (round-half-up).

function roundHalfToEven(value, decimals) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const rounded = Math.round(scaled) % 2 === 0
    ? Math.round(scaled)
    : Math.round(scaled * 2) / 2; // fallback for .5 cases
  // Use a more robust implementation: round half to even
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  let result;
  if (frac < 0.5) {
    result = floor;
  } else if (frac > 0.5) {
    result = floor + 1;
  } else {
    // Exactly 0.5: round to even
    result = (floor % 2 === 0) ? floor : floor + 1;
  }
  return result / factor;
}

// ─── Metric computation ─────────────────────────────────────────────────────
// Implements the five registered metrics per metrics/registry.json.

/**
 * Compute the five portable metrics from four token pillars.
 *
 * Null semantics (SPEC.md §13.3, §26):
 * - When a denominator is zero, the metric is null (not 0 or Infinity).
 * - When cache_read is null/unavailable, Yield, Leverage, and log_leverage are null.
 * - When cache_write is null/unavailable, log_leverage is null.
 * - log_leverage requires all four pillars > 0 (reference implementation policy).
 * - Warnings explain each null.
 *
 * @param {object} telemetry - { input, output, cache_write, cache_read }
 * @returns {{ metrics: object, warnings: string[] }}
 */
export function computeMetrics(telemetry) {
  const input = telemetry.input;
  const output = telemetry.output;
  const cacheWrite = telemetry.cache_write ?? telemetry.cache_creation ?? null;
  const cacheRead = telemetry.cache_read ?? null;

  const warnings = [];

  // output_fraction = output / (input + output)
  const ofDenom = input + output;
  const ofRaw = ofDenom > 0 ? output / ofDenom : null;
  if (ofRaw === null) warnings.push("output_fraction_undefined: input+output=0");

  // Velocity = output / input
  const velocityRaw = input > 0 ? output / input : null;
  if (velocityRaw === null) warnings.push("velocity_undefined: input=0");

  // Leverage = cache_read / input — null when cache_read is unavailable
  let leverageRaw = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (input > 0) {
    leverageRaw = cacheRead / input;
  } else {
    warnings.push("leverage_undefined: input=0");
  }

  // Yield = (cache_read × output) / input² = Leverage × Velocity
  let yieldRaw = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (leverageRaw !== null && velocityRaw !== null) {
    yieldRaw = leverageRaw * velocityRaw;
  } else {
    warnings.push("yield_undefined: requires input>0 and cache_read available");
  }

  // Cache-unavailable warnings (emitted before metric-specific undefined warnings
  // per SRP-METRIC-006 ordering: cache-unavailable before metric-undefined)
  const cacheWarnings = [];
  if (cacheWrite === null) {
    cacheWarnings.push("cache_write is unavailable; log_leverage is undefined.");
  }
  if (cacheRead === null) {
    cacheWarnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");
  }

  // log_leverage = log10(cache_read / input)
  // Reference implementation policy: requires all four pillars > 0
  let logLevRaw = null;
  const allFourPositive =
    input > 0 && output > 0 && cacheWrite !== null && cacheWrite > 0 &&
    cacheRead !== null && cacheRead > 0;
  if (!allFourPositive) {
    if (cacheWrite === null || cacheRead === null) {
      // already covered by cache warnings above
    } else if (input > 0 && cacheRead > 0) {
      // Some pillars are zero but input and cache_read are positive
      // Reference policy is stricter; emit specific warning
    }
    warnings.push("log_leverage_undefined: requires all four pillars > 0");
  } else {
    logLevRaw = Math.log10(cacheRead / input);
  }

  // Reorder warnings: cache-unavailable first, then metric-undefined (SRP-METRIC-006)
  const orderedWarnings = [...cacheWarnings, ...warnings];

  const metrics = {
    yield: roundHalfToEven(yieldRaw, 2),
    leverage: roundHalfToEven(leverageRaw, 1),
    velocity: roundHalfToEven(velocityRaw, 3),
    output_fraction: roundHalfToEven(ofRaw, 4),
    log_leverage: roundHalfToEven(logLevRaw, 2),
  };

  return { metrics, warnings: orderedWarnings };
}

// ─── Schema validation ──────────────────────────────────────────────────────
// Minimal JSON Schema validator covering the features used by
// schemas/telemetry-envelope-v0.1.schema.json.

function validateSchemaValue(value, schema, path, errors) {
  if (value === null) {
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.includes("null")) {
        errors.push(`${path}: null not allowed (expected ${types.join("|")})`);
      }
    }
    return;
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    let matched = false;
    for (const t of types) {
      if (t === "integer" && Number.isInteger(value)) matched = true;
      if (t === "number" && typeof value === "number" && !Number.isNaN(value)) matched = true;
      if (t === "string" && typeof value === "string") matched = true;
      if (t === "object" && typeof value === "object" && !Array.isArray(value)) matched = true;
      if (t === "array" && Array.isArray(value)) matched = true;
      if (t === "boolean" && typeof value === "boolean") matched = true;
    }
    if (!matched) {
      errors.push(`${path}: type mismatch (expected ${types.join("|")}, got ${Array.isArray(value) ? "array" : typeof value})`);
      return;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: value ${value} below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: value ${value} above maximum ${schema.maximum}`);
    }
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: string length ${value.length} below minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path}: string length ${value.length} above maxLength ${schema.maxLength}`);
    }
  }

  if (schema.type === "object" || (Array.isArray(schema.type) && schema.type.includes("object") && typeof value === "object" && !Array.isArray(value))) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (schema.required) {
        for (const req of schema.required) {
          if (!(req in value)) {
            errors.push(`${path}: missing required field "${req}"`);
          }
        }
      }
      if (schema.properties) {
        for (const [key, val] of Object.entries(value)) {
          if (key in schema.properties) {
            validateSchemaValue(val, schema.properties[key], `${path}.${key}`, errors);
          } else if (schema.additionalProperties === false) {
            errors.push(`${path}: additional property "${key}" not allowed`);
          }
        }
      }
    }
  }

  if (schema.type === "array" && Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, i) => {
        validateSchemaValue(item, schema.items, `${path}[${i}]`, errors);
      });
    }
  }
}

/**
 * Validate a telemetry envelope against the OTEP schema and semantic rules.
 *
 * @param {object} envelope - the telemetry envelope to validate
 * @param {object} schema - the parsed JSON Schema
 * @returns {{ valid: boolean, schemaErrors: string[], semanticErrors: string[], metrics: object|null, warnings: string[] }}
 */
export function validateEnvelope(envelope, schema) {
  const schemaErrors = [];
  const semanticErrors = [];

  // 1. Schema validation
  validateSchemaValue(envelope, schema, "envelope", schemaErrors);

  // 2. Semantic validation (SRP-VAL-002)
  // Forbidden field check runs even when schema validation fails (SRP-VAL-005/006
  // are safety-critical and must catch content leakage regardless of other errors)
  const checkForbidden = (obj, path) => {
    if (obj === null || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        semanticErrors.push(`${path}.${key}: forbidden field name`);
      }
      if (typeof val === "object" && val !== null) {
        checkForbidden(val, `${path}.${key}`);
      }
    }
  };
  checkForbidden(envelope, "envelope");

  if (schemaErrors.length === 0) {
    // Check real-world identity (SRP-DATA-011)
    if (envelope.operator?.pseudonymous_key) {
      const key = envelope.operator.pseudonymous_key;
      if (/@|\.com|\.org|\.net|employee|hr@|name=/i.test(key)) {
        semanticErrors.push("envelope.operator.pseudonymous_key: appears to contain real-world identity");
      }
    }

    // Check privacy mode constraints (SRP-PRIV-002)
    if (envelope.privacy?.mode === "public-pseudonymous" && envelope.operator?.cohort_id) {
      semanticErrors.push("envelope.operator.cohort_id: not allowed in public-pseudonymous mode");
    }

    // Check provenance level (SRP-PROV-002)
    if (envelope.provenance?.level === "signed" && !envelope.extensions) {
      semanticErrors.push("envelope: signed provenance requires extensions with signature object");
    }
  }

  const valid = schemaErrors.length === 0 && semanticErrors.length === 0;

  let metrics = null;
  let warnings = [];
  if (valid && envelope.telemetry) {
    const result = computeMetrics(envelope.telemetry);
    metrics = result.metrics;
    warnings = result.warnings;
  }

  return { valid, schemaErrors, semanticErrors, metrics, warnings };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === "compute-inline") {
    // node reference/otep.mjs compute-inline <input> <output> <cache_write> <cache_read>
    const [input, output, cacheWriteStr, cacheReadStr] = args.slice(1);
    if (input === undefined || output === undefined) {
      console.error("Usage: node reference/otep.mjs compute-inline <input> <output> <cache_write> <cache_read>");
      process.exit(2);
    }
    const telemetry = {
      input: parseInt(input, 10),
      output: parseInt(output, 10),
      cache_write: cacheWriteStr === "null" ? null : parseInt(cacheWriteStr, 10),
      cache_read: cacheReadStr === "null" ? null : parseInt(cacheReadStr, 10),
    };
    const { metrics, warnings } = computeMetrics(telemetry);
    console.log(JSON.stringify({ telemetry, metrics, warnings }, null, 2));
    process.exit(0);
  }

  if (mode === "compute") {
    // node reference/otep.mjs compute <telemetry.json>
    const file = args[1];
    if (!file) {
      console.error("Usage: node reference/otep.mjs compute <telemetry.json>");
      process.exit(2);
    }
    const telemetry = JSON.parse(readFileSync(file, "utf8"));
    const { metrics, warnings } = computeMetrics(telemetry);
    console.log(JSON.stringify({ telemetry, metrics, warnings }, null, 2));
    process.exit(0);
  }

  if (mode === "validate") {
    // node reference/otep.mjs validate <envelope.json>
    const file = args[1];
    if (!file) {
      console.error("Usage: node reference/otep.mjs validate <envelope.json>");
      process.exit(2);
    }
    const envelope = JSON.parse(readFileSync(file, "utf8"));
    const schema = loadSchema();
    const result = validateEnvelope(envelope, schema);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  console.error("Usage: node reference/otep.mjs <validate|compute|compute-inline> <args>");
  process.exit(2);
}

// Export for use as a module; run CLI only when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { roundHalfToEven, SPEC_VERSION, METRIC_SPEC_VERSION };

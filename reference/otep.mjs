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
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

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
// Full JSON Schema 2020-12 validation via ajv. The hand-written validator was
// replaced because it missed format (date-time), additionalProperties with
// schema objects, and collection constraints.

const _ajv = new Ajv({ allErrors: true, strict: false });
addFormats(_ajv);
const _validatorCache = new WeakMap();

function _getValidator(schema) {
  let v = _validatorCache.get(schema);
  if (!v) {
    v = _ajv.compile(schema);
    _validatorCache.set(schema, v);
  }
  return v;
}

function validateWithAjv(envelope, schema, errors) {
  const validate = _getValidator(schema);
  const ok = validate(envelope);
  if (!ok) {
    for (const e of validate.errors || []) {
      const path = e.instancePath || "(root)";
      errors.push(`${path}: ${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ""}`);
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

  // 1. Schema validation (ajv — full JSON Schema 2020-12)
  validateWithAjv(envelope, schema, schemaErrors);

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

    // P1-5: signed provenance with signature_status "valid" is not verified in v0.1
    if (envelope.provenance?.level === "signed" && envelope.provenance?.signature_status === "valid") {
      semanticErrors.push("envelope.provenance.signature_status: 'valid' not supported in v0.1 (no cryptographic verification). Use 'signature-present-unverified'.");
    }

    // P2-8: raw_provider_fields must only contain scalar values
    if (envelope.raw_provider_fields) {
      for (const [key, val] of Object.entries(envelope.raw_provider_fields)) {
        if (typeof val === "object" && val !== null) {
          semanticErrors.push(`envelope.raw_provider_fields.${key}: non-scalar value not allowed (SRP-VAL-007)`);
        }
      }
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

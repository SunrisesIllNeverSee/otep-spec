/**
 * lib/envelope-validator.mjs — Single source of truth for TTEOP envelope validation.
 *
 * This module establishes ONE Ajv 2020-12 validation module used by:
 *   - reference/tteop.mjs
 *   - conformance/tteop-validate.mjs
 *   - conformance/tteop-runner.mjs
 *
 * Exports:
 *   - loadSchema() — load and compile the canonical envelope schema once
 *   - validateEnvelopeSchema(envelope, schema) — pure JSON Schema validation
 *   - validateEnvelopeSemantics(envelope, options) — all semantic rules
 *   - validateEnvelope(envelope, options) — combined schema + semantic validation
 *   - computeMetrics(telemetry) — canonical metric computation with banker's rounding
 *   - FORBIDDEN_FIELDS — the forbidden field name list
 *   - PRIVACY_MODES — valid privacy modes
 *   - PROVENANCE_LEVELS — valid provenance levels
 *   - SPEC_VERSION, METRIC_SPEC_VERSION — canonical version strings
 *
 * License: Apache-2.0
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Constants ──────────────────────────────────────────────────────────────

export const SPEC_VERSION = "tteop/0.1-draft";
export const METRIC_SPEC_VERSION = "tteop-metrics/0.1-draft";
export const LEGACY_ALIASES = ["otep/0.1-draft", "sigrank/0.1-draft"];
export const LEGACY_ALIAS = "sigrank/0.1-draft"; // retained for backward compat with code reading LEGACY_ALIAS
export const SUPPORTED_VERSIONS = [SPEC_VERSION, ...LEGACY_ALIASES];

export const FORBIDDEN_FIELDS = [
  "prompt", "prompt_text", "completion", "completion_text", "response_text",
  "source_code", "code", "diff", "keystrokes", "screen_content",
  "file_path", "file_content", "repo_content",
];

export const PRIVACY_MODES = ["public-pseudonymous", "private-managed-cohort", "enterprise-isolated"];
export const PROVENANCE_LEVELS = ["self-reported", "collector-attested", "platform-verified", "signed"];

// Legacy metric name aliases (SPEC §26.4/26.5).
// Envelopes carrying these metric keys are normalized to the canonical name
// before schema validation so that legacy producers don't fail
// additionalProperties:false on the metrics object.
export const LEGACY_METRIC_ALIASES = {
  snr: "output_fraction",
  SNR: "output_fraction",
  dev10x: "log_leverage",
  "10xDEV": "log_leverage",
};

const SCHEMA_PATH = join(ROOT, "schemas", "telemetry-envelope-v0.1.schema.json");

// ─── Schema loading and compilation (once per process) ──────────────────────

let _compiledValidator = null;
let _loadedSchema = null;

/**
 * Load and compile the canonical envelope schema.
 * Compiled once per process; cached for subsequent calls.
 *
 * @returns {{ schema: object, validate: function }}
 */
export function loadSchema() {
  if (_compiledValidator) {
    return { schema: _loadedSchema, validate: _compiledValidator };
  }
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  _loadedSchema = schema;
  _compiledValidator = ajv.compile(schema);
  return { schema, validate: _compiledValidator };
}

// ─── Schema validation ──────────────────────────────────────────────────────

/**
 * Normalize legacy metric names in an envelope's metrics object.
 * Maps snr→output_fraction, dev10x→log_leverage (and case variants).
 * Returns a new envelope with normalized metrics; does not mutate the input.
 *
 * If both the legacy alias and canonical name are present:
 *   - Equal values: alias dropped, canonical kept (lossless).
 *   - Conflicting values: throws an error (ambiguous envelopes are rejected,
 *     not silently resolved — interoperability requires determinism).
 */
export function normalizeLegacyMetrics(envelope) {
  if (!envelope || typeof envelope !== "object" || !envelope.metrics || typeof envelope.metrics !== "object") {
    return envelope;
  }
  const metrics = envelope.metrics;
  const hasLegacy = Object.keys(LEGACY_METRIC_ALIASES).some(k => k in metrics);
  if (!hasLegacy) return envelope;

  const normalized = { ...metrics };
  for (const [legacy, canonical] of Object.entries(LEGACY_METRIC_ALIASES)) {
    if (legacy in normalized) {
      if (canonical in normalized) {
        // Both present — check for conflict
        if (normalized[legacy] !== normalized[canonical]) {
          throw new Error(
            `Ambiguous metrics: '${legacy}' (${JSON.stringify(normalized[legacy])}) and '${canonical}' (${JSON.stringify(normalized[canonical])}) have conflicting values`
          );
        }
        // Values match — drop the alias, keep canonical
      } else {
        // Alias-only — promote to canonical
        normalized[canonical] = normalized[legacy];
      }
      delete normalized[legacy];
    }
  }
  return { ...envelope, metrics: normalized };
}

/**
 * Validate an envelope against the canonical JSON Schema.
 * Legacy metric names (snr, dev10x) are normalized to canonical names
 * (output_fraction, log_leverage) before validation per SPEC §26.4/26.5.
 *
 * @param {object} envelope - the envelope to validate
 * @param {object} [schema] - pre-loaded schema (uses canonical if omitted)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEnvelopeSchema(envelope, schema) {
  const { validate } = loadSchema();
  let normalized;
  try {
    normalized = normalizeLegacyMetrics(envelope);
  } catch (e) {
    return { valid: false, errors: [`/metrics: ${e.message}`] };
  }
  const ok = validate(normalized);
  if (ok) return { valid: true, errors: [] };
  const errors = (validate.errors || []).map(e => {
    const path = e.instancePath || "(root)";
    return `${path}: ${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ""}`;
  });
  return { valid: false, errors };
}

// ─── Semantic validation ────────────────────────────────────────────────────

/**
 * Validate all semantic rules that JSON Schema cannot express.
 *
 * Checks:
 *   - Forbidden field names (SRP-VAL-005/006) — runs even if schema fails
 *   - Missingness flags (SRP-MISS-001/002/003)
 *   - Privacy mode constraints (SRP-PRIV-002/004)
 *   - Provenance signature restrictions (SRP-PROV-002/005)
 *   - Raw provider field scalar restrictions (SRP-VAL-007)
 *   - Pseudonymous key identity leakage (SRP-DATA-011)
 *   - Extension namespace rules (SRP-EXT-003)
 *
 * @param {object} envelope - the envelope to validate
 * @param {object} [options] - optional configuration
 * @param {string} [options.expectedProfile] - if set, assert envelope matches this privacy mode
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateEnvelopeSemantics(envelope, options = {}) {
  const errors = [];
  const warnings = [];

  // 1. Forbidden field check — runs even when schema validation fails
  //    (SRP-VAL-005/006 are safety-critical)
  const checkForbidden = (obj, path) => {
    if (obj === null || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        errors.push(`${path}.${key}: forbidden field name (SRP-VAL-006)`);
      }
      if (typeof val === "object" && val !== null) {
        checkForbidden(val, `${path}.${key}`);
      }
    }
  };
  checkForbidden(envelope, "envelope");

  // Remaining checks only make sense if the envelope is structurally valid
  if (!envelope || typeof envelope !== "object") return { errors, warnings };

  // 2. Missingness flags (SRP-MISS-001/002/003)
  const telemetry = envelope.telemetry;
  if (telemetry) {
    const flags = envelope.validity?.missingness_flags ?? [];
    if (telemetry.cache_write === null) {
      if (!flags.some(f => f.startsWith("cache_write_"))) {
        errors.push("telemetry.cache_write is null but no cache_write_* missingness flag present (SRP-MISS-001)");
      }
    }
    if (telemetry.cache_read === null) {
      if (!flags.some(f => f.startsWith("cache_read_"))) {
        errors.push("telemetry.cache_read is null but no cache_read_* missingness flag present (SRP-MISS-002)");
      }
    }
  }

  // 3. Privacy mode constraints (SRP-PRIV-002/004)
  const mode = envelope.privacy?.mode;
  if (mode === "public-pseudonymous") {
    if (envelope.operator?.cohort_id != null) {
      errors.push("envelope.operator.cohort_id: not allowed in public-pseudonymous mode (SRP-PRIV-002)");
    }
  }
  if (mode === "private-managed-cohort") {
    if (envelope.operator?.cohort_id == null) {
      warnings.push("private-managed-cohort mode SHOULD include cohort_id (SRP-PRIV-004)");
    }
  }

  // 4. Provenance signature restrictions (SRP-PROV-002/005)
  if (envelope.provenance?.level === "signed") {
    if (!envelope.extensions) {
      errors.push("envelope: signed provenance requires extensions with signature object (SRP-PROV-002)");
    }
    if (envelope.provenance?.signature_status === "valid") {
      errors.push("envelope.provenance.signature_status: 'valid' not supported in v0.1 — no cryptographic verification implemented. Use 'signature-present-unverified'. (SRP-PROV-005)");
    }
  }

  // 5. Raw provider field scalar restrictions (SRP-VAL-007)
  if (envelope.raw_provider_fields) {
    for (const [key, val] of Object.entries(envelope.raw_provider_fields)) {
      if (typeof val === "object" && val !== null) {
        errors.push(`envelope.raw_provider_fields.${key}: non-scalar value not allowed (SRP-VAL-007)`);
      }
    }
  }

  // 6. Pseudonymous key identity leakage (SRP-DATA-011)
  if (envelope.operator?.pseudonymous_key) {
    const key = envelope.operator.pseudonymous_key;
    if (/@|\.com|\.org|\.net|employee|hr@|name=/i.test(key)) {
      errors.push("envelope.operator.pseudonymous_key: appears to contain real-world identity (SRP-DATA-011)");
    }
  }

  // 7. Extension namespace rules (SRP-EXT-003)
  //    SPEC §19.1: extensions MUST use a namespace prefix (e.g., "com.example.myext")
  //    Accepted forms: reverse-DNS with dots (com.example.sig), colon-separated
  //    (com:example:sig), or x- prefix (x-custom).
  if (envelope.extensions) {
    for (const key of Object.keys(envelope.extensions)) {
      if (!key.includes(".") && !key.includes(":") && !key.startsWith("x-")) {
        errors.push(`envelope.extensions.${key}: extension namespace must contain '.' or ':' or start with 'x-' (SRP-EXT-003)`);
      }
    }
  }

  // 8. Profile assertion (if --profile was supplied)
  if (options.expectedProfile && mode && mode !== options.expectedProfile) {
    errors.push(`privacy.mode is "${mode}" but expected profile "${options.expectedProfile}" (--profile assertion)`);
  }

  return { errors, warnings };
}

// ─── Combined validation ────────────────────────────────────────────────────

/**
 * Validate an envelope against both schema and semantic rules.
 *
 * @param {object} envelope - the envelope to validate
 * @param {object} [options] - optional configuration
 * @param {string} [options.expectedProfile] - expected privacy profile
 * @param {boolean} [options.computeMetrics=true] - whether to compute metrics if valid
 * @returns {{
 *   valid: boolean,
 *   schemaErrors: string[],
 *   semanticErrors: string[],
 *   semanticWarnings: string[],
 *   metrics: object|null,
 *   metricWarnings: string[],
 *   protocolVersion: string|null
 * }}
 */
export function validateEnvelope(envelope, options = {}) {
  const { computeMetrics: shouldCompute = true } = options;

  // Normalize legacy metric names before any validation.
  // If normalization fails (conflicting alias/canonical values), surface as
  // a schema error rather than crashing the caller.
  let normalized;
  try {
    normalized = normalizeLegacyMetrics(envelope);
  } catch (e) {
    return {
      valid: false,
      schemaErrors: [`/metrics: ${e.message}`],
      semanticErrors: [],
      semanticWarnings: [],
      metrics: null,
      metricWarnings: [],
      protocolVersion: envelope?.protocol_version ?? null,
    };
  }

  // Schema validation
  const { valid: schemaValid, errors: schemaErrors } = validateEnvelopeSchema(normalized);

  // Semantic validation (always runs — forbidden field check is safety-critical)
  const { errors: semanticErrors, warnings: semanticWarnings } = validateEnvelopeSemantics(normalized, options);

  const valid = schemaValid && semanticErrors.length === 0;

  let metrics = null;
  let metricWarnings = [];
  if (valid && shouldCompute && normalized.telemetry) {
    const result = computeMetrics(normalized.telemetry);
    metrics = result.metrics;
    metricWarnings = result.warnings;
  }

  return {
    valid,
    schemaErrors,
    semanticErrors,
    semanticWarnings,
    metrics,
    metricWarnings,
    protocolVersion: normalized?.protocol_version ?? null,
  };
}

// ─── Metric computation (canonical, with banker's rounding) ─────────────────

/**
 * Banker's rounding (round-half-to-even) per SRP-METRIC-002.
 * @param {number|null} value
 * @param {number} decimals
 * @returns {number|null}
 */
export function roundHalfToEven(value, decimals) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  let result;
  if (frac < 0.5) {
    result = floor;
  } else if (frac > 0.5) {
    result = floor + 1;
  } else {
    result = (floor % 2 === 0) ? floor : floor + 1;
  }
  return result / factor;
}

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
  const cacheWarnings = [];

  // output_fraction = output / (input + output)
  const ofDenom = input + output;
  const ofRaw = ofDenom > 0 ? output / ofDenom : null;
  if (ofRaw === null) warnings.push("output_fraction_undefined: input+output=0");

  // Velocity = output / input
  const velocityRaw = input > 0 ? output / input : null;
  if (velocityRaw === null) warnings.push("velocity_undefined: input=0");

  // Leverage = cache_read / input
  let leverageRaw = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (input > 0) {
    leverageRaw = cacheRead / input;
  } else {
    warnings.push("leverage_undefined: input=0");
  }

  // Yield = (cache_read × output) / input² = Leverage × Velocity
  let yRaw = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (leverageRaw !== null && velocityRaw !== null) {
    yRaw = leverageRaw * velocityRaw;
  } else {
    warnings.push("yield_undefined: requires input>0 and cache_read available");
  }

  // Cache-unavailable warnings (emitted before metric-specific undefined warnings)
  if (cacheWrite === null) {
    cacheWarnings.push("cache_write is unavailable; log_leverage is undefined.");
  }
  if (cacheRead === null) {
    cacheWarnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");
  }

  // log_leverage = log10(cache_read / input)
  const allFourPositive = (
    input > 0 && output > 0 &&
    cacheWrite !== null && cacheWrite > 0 &&
    cacheRead !== null && cacheRead > 0
  );
  let logLevRaw = null;
  if (!allFourPositive) {
    warnings.push("log_leverage_undefined: requires all four pillars > 0");
  } else {
    logLevRaw = Math.log10(cacheRead / input);
  }

  // Reorder: cache-unavailable first, then metric-undefined (SRP-METRIC-006)
  const orderedWarnings = [...cacheWarnings, ...warnings];

  return {
    metrics: {
      yield: roundHalfToEven(yRaw, 2),
      leverage: roundHalfToEven(leverageRaw, 1),
      velocity: roundHalfToEven(velocityRaw, 3),
      output_fraction: roundHalfToEven(ofRaw, 4),
      log_leverage: roundHalfToEven(logLevRaw, 2),
    },
    warnings: orderedWarnings,
  };
}

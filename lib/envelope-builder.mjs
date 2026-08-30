/**
 * lib/envelope-builder.mjs — Stable JavaScript runtime API for building TTEOP envelopes.
 *
 * This is the canonical, production-importable builder. It is the single source
 * of truth for envelope construction from raw token telemetry. Other integrations
 * (TypeScript example, MCP servers, CLI) SHOULD import from here rather than
 * duplicating the construction logic.
 *
 * Metric computation is delegated to lib/envelope-validator.mjs (the single source
 * of truth for the five portable metrics with banker's rounding).
 *
 * Exports:
 *   - buildEnvelope(telemetry, options) — build a schema-conforming TTEOP envelope
 *   - buildRecord(telemetry, options)   — backward-compatible alias for buildEnvelope
 *
 * The returned envelope validates against
 * schemas/telemetry-envelope-v0.1.schema.json and satisfies the semantic rules
 * in lib/envelope-validator.mjs (SRP-PRIV-002, SRP-MISS-001/002, etc.).
 *
 * License: Apache-2.0
 */

import {
  computeMetrics,
  SPEC_VERSION,
  METRIC_SPEC_VERSION,
} from "./envelope-validator.mjs";

/**
 * @typedef {Object} Telemetry
 * @property {number} input          - Fresh input tokens (non-negative safe integer).
 * @property {number} output         - Output tokens (non-negative safe integer).
 * @property {number|null} [cache_write] - Cache-write tokens, or null when unavailable.
 * @property {number|null} [cache_read]  - Cache-read tokens, or null when unavailable.
 */

/**
 * @typedef {Object} BuildEnvelopeOptions
 * @property {string} [tool]                 - AI tool name (e.g., 'claude-code').
 * @property {string|null} [platform]        - Platform name.
 * @property {string|null} [provider]        - Provider name (e.g., 'anthropic').
 * @property {string|null} [model]           - Model identifier.
 * @property {string|null} [adapter_id]      - Adapter identifier.
 * @property {string|null} [adapter_version] - Adapter version.
 * @property {string|null} [operator_key]    - Pseudonymous operator key.
 * @property {string|null} [cohort_id]       - Cohort identifier (requires operator_key).
 * @property {"public-pseudonymous"|"private-managed-cohort"|"enterprise-isolated"} [privacy_mode]
 * @property {"self-reported"|"collector-attested"|"platform-verified"|"signed"} [provenance_level]
 * @property {string|null} [window_start]    - ISO-8601 window start.
 * @property {string|null} [window_end]      - ISO-8601 window end.
 * @property {number|null} [window_duration_seconds]
 */

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

/**
 * Validate a token field: must be a non-negative safe integer.
 * Returns the validated value or null if explicitly null/undefined.
 * Throws if the value is invalid.
 *
 * @param {number|null|undefined} value
 * @param {string} fieldName
 * @returns {number|null}
 */
function validateTokenField(value, fieldName) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(
      `${fieldName} must be an integer, got ${typeof value === "number" ? value : typeof value}`,
    );
  }
  if (value < 0) {
    throw new RangeError(`${fieldName} must be non-negative, got ${value}`);
  }
  if (value > MAX_SAFE_INTEGER) {
    throw new RangeError(`${fieldName} exceeds MAX_SAFE_INTEGER, got ${value}`);
  }
  return value;
}

/**
 * Build a TTEOP v0.1-draft schema-conforming envelope from token telemetry.
 *
 * Computes Yield, Leverage, Velocity, output_fraction, and log_leverage via the
 * shared metric module (banker's rounding per SRP-METRIC-002). Emits missingness
 * flags for null cache values (SRP-MISS-001/002). Enforces privacy-mode
 * constraints (SRP-PRIV-002: public-pseudonymous excludes cohort_id) and the
 * cohort_id-requires-operator_key rule.
 *
 * @param {Telemetry} telemetry
 * @param {BuildEnvelopeOptions} [options={}]
 * @returns {object} a TTEOP envelope conforming to schemas/telemetry-envelope-v0.1.schema.json
 * @throws {TypeError|RangeError} on invalid token values
 * @throws {Error} if cohort_id is supplied without operator_key
 */
export function buildEnvelope(telemetry, options = {}) {
  if (!telemetry || typeof telemetry !== "object") {
    throw new TypeError("buildEnvelope: telemetry must be an object");
  }
  const input = validateTokenField(telemetry.input, "input");
  const output = validateTokenField(telemetry.output, "output");
  if (input === null) {
    throw new TypeError("buildEnvelope: input is required and must be a non-negative integer");
  }
  if (output === null) {
    throw new TypeError("buildEnvelope: output is required and must be a non-negative integer");
  }
  const cacheWrite = validateTokenField(telemetry.cache_write, "cache_write");
  const cacheRead = validateTokenField(telemetry.cache_read, "cache_read");

  const { metrics, warnings } = computeMetrics({
    input,
    output,
    cache_write: cacheWrite,
    cache_read: cacheRead,
  });

  const now = new Date().toISOString();

  // Missingness flags (SRP-MISS-001/002): null cache values MUST be flagged.
  const missingnessFlags = [];
  if (cacheWrite === null) missingnessFlags.push("cache_write_not_reported");
  if (cacheRead === null) missingnessFlags.push("cache_read_not_reported");

  const privacyMode = options.privacy_mode ?? "public-pseudonymous";
  const envelope = {
    protocol_version: SPEC_VERSION,
    metric_spec_version: METRIC_SPEC_VERSION,
    observation: {
      timestamp: now,
      window_start: options.window_start ?? null,
      window_end: options.window_end ?? null,
      window_duration_seconds: options.window_duration_seconds ?? null,
    },
    source: {
      tool: options.tool ?? "unknown",
      platform: options.platform ?? null,
      provider: options.provider ?? null,
      model: options.model ?? null,
      adapter_id: options.adapter_id ?? null,
      adapter_version: options.adapter_version ?? null,
    },
    telemetry: {
      input,
      output,
      cache_write: cacheWrite,
      cache_read: cacheRead,
    },
    provenance: {
      level: options.provenance_level ?? "self-reported",
      signature_status: "unsigned",
    },
    privacy: {
      mode: privacyMode,
    },
    metrics,
    warnings,
  };

  // Attach operator when operator_key or cohort_id is provided.
  // SRP-PRIV-002: public-pseudonymous mode excludes cohort_id.
  // SRP-PRIV-004: private-managed-cohort mode SHOULD include cohort_id.
  // cohort_id without operator_key is rejected: cohort membership without a
  // pseudonymous operator identifier has no meaningful privacy semantics.
  if (options.operator_key || options.cohort_id !== undefined) {
    let cohortId = options.cohort_id ?? null;
    if (privacyMode === "public-pseudonymous") {
      cohortId = null;
    }
    if (options.operator_key) {
      envelope.operator = {
        pseudonymous_key: options.operator_key,
        cohort_id: cohortId,
      };
    } else if (options.cohort_id !== undefined && options.cohort_id !== null) {
      throw new Error(
        "buildEnvelope: cohort_id requires operator_key — cannot define cohort membership without a pseudonymous operator identifier",
      );
    }
  }

  // Attach validity only when there are missingness flags (keeps minimal envelope clean).
  if (missingnessFlags.length > 0) {
    envelope.validity = {
      status: "partial",
      missingness_flags: missingnessFlags,
    };
  }

  return envelope;
}

/**
 * Backward-compatible alias for buildEnvelope.
 * Kept so consumers importing `buildRecord` (the pre-rename name) continue to work.
 */
export const buildRecord = buildEnvelope;

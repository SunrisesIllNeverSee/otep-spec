/**
 * integrations/typescript/example.ts
 *
 * Minimal TypeScript implementation of the TTEOP v0.1-draft
 * five-metric portable core + schema-conforming envelope builder.
 * No dependencies.
 *
 * A conforming implementation MUST produce envelopes that validate
 * against schemas/telemetry-envelope-v0.1.schema.json.
 */

export interface Telemetry {
  input: number;
  output: number;
  cache_write?: number | null;
  cache_read?: number | null;
}

export interface Metrics {
  yield: number | null;
  leverage: number | null;
  velocity: number | null;
  output_fraction: number | null;
  log_leverage: number | null;
}

export interface TteopEnvelope {
  protocol_version: "tteop/0.1-draft" | "otep/0.1-draft" | "sigrank/0.1-draft";
  metric_spec_version: string;
  observation: {
    timestamp: string;
    window_start: string | null;
    window_end: string | null;
    window_duration_seconds: number | null;
  };
  source: {
    tool: string;
    platform: string | null;
    provider: string | null;
    model: string | null;
    adapter_id: string | null;
    adapter_version: string | null;
  };
  telemetry: {
    input: number;
    output: number;
    cache_write: number | null;
    cache_read: number | null;
  };
  provenance: {
    level: "self-reported" | "collector-attested" | "platform-verified" | "signed";
    signature_status: "unsigned" | "valid" | "invalid" | "not-applicable" | "signature-present-unverified";
  };
  privacy: {
    mode: "public-pseudonymous" | "private-managed-cohort" | "enterprise-isolated";
  };
  operator?: {
    pseudonymous_key: string;
    cohort_id: string | null;
  };
  metrics: Metrics;
  warnings: string[];
  validity?: {
    status: "valid" | "invalid" | "partial";
    missingness_flags?: string[];
    anomaly_flags?: string[];
  };
}

/**
 * Backward-compatible alias for the pre-rename "OTEP" type name.
 * Kept so existing TS consumers importing `OtepEnvelope` continue to compile
 * after the OTEP → TTEOP rename (see UNRESOLVED-DECISIONS.md UD-1).
 */
export type OtepEnvelope = TteopEnvelope;

// ─── Banker's rounding (round-half-to-even) ─────────────────────────────────
// SPEC.md SRP-METRIC-002 requires round-half-to-even, NOT toFixed (round-half-up).

function roundHalfToEven(value: number | null, decimals: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  let result: number;
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

export function computeMetrics(t: Telemetry): { metrics: Metrics; warnings: string[] } {
  const input = t.input;
  const output = t.output;
  const cacheWrite = t.cache_write ?? null;
  const cacheRead = t.cache_read ?? null;
  const warnings: string[] = [];
  const cacheWarnings: string[] = [];

  const ofDenom = input + output;
  const ofRaw = ofDenom > 0 ? output / ofDenom : null;
  if (ofRaw === null) warnings.push("output_fraction_undefined: input+output=0");

  const velocity = input > 0 ? output / input : null;
  if (velocity === null) warnings.push("velocity_undefined: input=0");

  let leverage: number | null = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (input > 0) {
    leverage = cacheRead / input;
  } else {
    warnings.push("leverage_undefined: input=0");
  }

  let y: number | null = null;
  if (cacheRead === null) {
    // unavailable → null
  } else if (leverage !== null && velocity !== null) {
    y = leverage * velocity;
  } else {
    warnings.push("yield_undefined: requires input>0 and cache_read available");
  }

  if (cacheWrite === null) cacheWarnings.push("cache_write is unavailable; log_leverage is undefined.");
  if (cacheRead === null) cacheWarnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");

  const allFourPositive =
    input > 0 && output > 0 && cacheWrite !== null && cacheWrite > 0 &&
    cacheRead !== null && cacheRead > 0;
  let logLev: number | null = null;
  if (!allFourPositive) {
    warnings.push("log_leverage_undefined: requires all four pillars > 0");
  } else {
    logLev = Math.log10(cacheRead / input);
  }

  const orderedWarnings = [...cacheWarnings, ...warnings];

  return {
    metrics: {
      yield: roundHalfToEven(y, 2),
      leverage: roundHalfToEven(leverage, 1),
      velocity: roundHalfToEven(velocity, 3),
      output_fraction: roundHalfToEven(ofRaw, 4),
      log_leverage: roundHalfToEven(logLev, 2),
    },
    warnings: orderedWarnings,
  };
}

export interface BuildEnvelopeOptions {
  tool?: string;
  platform?: string | null;
  provider?: string | null;
  model?: string | null;
  adapter_id?: string | null;
  adapter_version?: string | null;
  operator_key?: string | null;
  cohort_id?: string | null;
  privacy_mode?: "public-pseudonymous" | "private-managed-cohort" | "enterprise-isolated";
  provenance_level?: "self-reported" | "collector-attested" | "platform-verified" | "signed";
  window_start?: string | null;
  window_end?: string | null;
  window_duration_seconds?: number | null;
}

export function buildEnvelope(t: Telemetry, opts: BuildEnvelopeOptions = {}): TteopEnvelope {
  const { metrics, warnings } = computeMetrics(t);
  const now = new Date().toISOString();

  // Build missingness flags (SRP-MISS-001/002): null cache values MUST be flagged
  const missingnessFlags: string[] = [];
  const cacheWrite = t.cache_write ?? null;
  const cacheRead = t.cache_read ?? null;
  if (cacheWrite === null) missingnessFlags.push("cache_write_not_reported");
  if (cacheRead === null) missingnessFlags.push("cache_read_not_reported");

  const envelope: TteopEnvelope = {
    protocol_version: "tteop/0.1-draft",
    metric_spec_version: "tteop-metrics/0.1-draft",
    observation: {
      timestamp: now,
      window_start: opts.window_start ?? null,
      window_end: opts.window_end ?? null,
      window_duration_seconds: opts.window_duration_seconds ?? null,
    },
    source: {
      tool: opts.tool ?? "unknown",
      platform: opts.platform ?? null,
      provider: opts.provider ?? null,
      model: opts.model ?? null,
      adapter_id: opts.adapter_id ?? null,
      adapter_version: opts.adapter_version ?? null,
    },
    telemetry: {
      input: t.input,
      output: t.output,
      cache_write: cacheWrite,
      cache_read: cacheRead,
    },
    provenance: {
      level: opts.provenance_level ?? "self-reported",
      signature_status: "unsigned",
    },
    privacy: {
      mode: opts.privacy_mode ?? "public-pseudonymous",
    },
    metrics,
    warnings,
  };

  // Attach operator when operator_key or cohort_id is provided.
  // In public-pseudonymous mode, cohort_id MUST be null (SRP-PRIV-002).
  // In private-managed-cohort mode, cohort_id SHOULD be set (SRP-PRIV-004).
  // cohort_id without operator_key is rejected: a cohort membership without
  // a pseudonymous operator identifier has no meaningful privacy semantics.
  if (opts.operator_key || opts.cohort_id !== undefined) {
    const privacyMode = opts.privacy_mode ?? "public-pseudonymous";
    let cohortId: string | null = opts.cohort_id ?? null;
    // Enforce SRP-PRIV-002: public-pseudonymous mode excludes cohort_id
    if (privacyMode === "public-pseudonymous") {
      cohortId = null;
    }
    if (opts.operator_key) {
      envelope.operator = {
        pseudonymous_key: opts.operator_key,
        cohort_id: cohortId,
      };
    } else if (opts.cohort_id !== undefined && opts.cohort_id !== null) {
      // cohort_id supplied without operator_key — reject explicitly
      throw new Error(
        "buildEnvelope: cohort_id requires operator_key — cannot define cohort membership without a pseudonymous operator identifier"
      );
    }
  }

  // Attach validity only when there are missingness flags (keeps minimal envelope clean)
  if (missingnessFlags.length > 0) {
    envelope.validity = {
      status: "partial",
      missingness_flags: missingnessFlags,
    };
  }

  return envelope;
}

// Backward-compatible alias
export const buildRecord = buildEnvelope;

if (typeof require !== "undefined" && require.main === module) {
  const envelope = buildEnvelope(
    { input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 },
    { tool: "claude-code", provider: "anthropic", model: "claude-sonnet-4" }
  );
  console.log(JSON.stringify(envelope, null, 2));
}

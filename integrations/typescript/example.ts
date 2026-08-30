/**
 * integrations/typescript/example.ts
 *
 * Minimal TypeScript implementation of the OTEP v0.1-draft
 * five-metric portable core. No dependencies.
 *
 * A conforming implementation MUST produce the same results as the
 * conformance suite test vectors for the same inputs.
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

export interface OtepRecord {
  spec: "otep/0.1-draft";
  timestamp: string;
  source: {
    provider: string;
    model: string;
    tool: string;
  };
  telemetry: {
    input: number;
    output: number;
    cache_write: number | null;
    cache_read: number | null;
  };
  metrics: Metrics;
  warnings: string[];
}

function round(n: number | null, d: number): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  return Number(n.toFixed(d));
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

  // Cache-unavailable warnings (emitted before metric-specific undefined warnings
  // per SRP-METRIC-006 ordering: cache-unavailable before metric-undefined)
  if (cacheWrite === null) cacheWarnings.push("cache_write is unavailable; log_leverage is undefined.");
  if (cacheRead === null) cacheWarnings.push("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.");

  // log_leverage = log10(cache_read / input) — requires all four pillars > 0
  const allFourPositive =
    input > 0 && output > 0 && cacheWrite !== null && cacheWrite > 0 &&
    cacheRead !== null && cacheRead > 0;
  let logLev: number | null = null;
  if (!allFourPositive) {
    warnings.push("log_leverage_undefined: requires all four pillars > 0");
  } else {
    logLev = Math.log10(cacheRead / input);
  }

  // Reorder: cache-unavailable first, then metric-undefined (SRP-METRIC-006)
  const orderedWarnings = [...cacheWarnings, ...warnings];

  return {
    metrics: {
      yield: round(y, 2),
      leverage: round(leverage, 1),
      velocity: round(velocity, 3),
      output_fraction: round(ofRaw, 4),
      log_leverage: round(logLev, 2),
    },
    warnings: orderedWarnings,
  };
}

export function buildRecord(t: Telemetry, source: { provider: string; model: string; tool: string }): OtepRecord {
  const { metrics, warnings } = computeMetrics(t);
  return {
    spec: "otep/0.1-draft",
    timestamp: new Date().toISOString(),
    source,
    telemetry: {
      input: t.input,
      output: t.output,
      cache_write: t.cache_write ?? null,
      cache_read: t.cache_read ?? null,
    },
    metrics,
    warnings,
  };
}

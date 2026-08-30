/**
 * reference/tteop.mjs — TTEOP v0.1-draft reference implementation.
 *
 * This is the reference implementation for the Token Telemetry Evaluation Operator
 * Protocol. It is normative only insofar as it demonstrates conformity with
 * SPEC.md; it does not silently define undocumented behavior.
 *
 * Validation and metric computation are delegated to the shared module
 * lib/envelope-validator.mjs, which is the single source of truth used by
 * reference/tteop.mjs, conformance/tteop-validate.mjs, and
 * conformance/tteop-runner.mjs.
 *
 * Two modes:
 *   - `validate`  — validate a telemetry envelope against the TTEOP schema and
 *                    semantic rules, then compute metrics if valid.
 *   - `compute`   — compute the five registered metrics from a telemetry
 *                    object (input, output, cache_write, cache_read).
 *
 * Usage:
 *   node reference/tteop.mjs validate <envelope.json>
 *   node reference/tteop.mjs compute  <telemetry.json>
 *   node reference/tteop.mjs compute-inline <input> <output> <cache_write> <cache_read>
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

import {
  validateEnvelope as _validateEnvelope,
  computeMetrics as _computeMetrics,
  validateEnvelopeSchema,
  validateEnvelopeSemantics,
  loadSchema,
  roundHalfToEven,
  SPEC_VERSION,
  METRIC_SPEC_VERSION,
  FORBIDDEN_FIELDS,
  PRIVACY_MODES,
  PROVENANCE_LEVELS,
} from "../lib/envelope-validator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Re-export the shared functions and constants so existing imports of
// reference/tteop.mjs continue to work.
export {
  _computeMetrics as computeMetrics,
  validateEnvelopeSchema,
  validateEnvelopeSemantics,
  roundHalfToEven,
  SPEC_VERSION,
  METRIC_SPEC_VERSION,
  FORBIDDEN_FIELDS,
  PRIVACY_MODES,
  PROVENANCE_LEVELS,
};

/**
 * Validate a telemetry envelope against the TTEOP schema and semantic rules.
 *
 * Delegates to lib/envelope-validator.mjs — the single source of truth.
 *
 * @param {object} envelope - the telemetry envelope to validate
 * @param {object} [_schema] - ignored; the canonical schema is compiled once in the shared module
 * @returns {{ valid: boolean, schemaErrors: string[], semanticErrors: string[], metrics: object|null, warnings: string[] }}
 */
export function validateEnvelope(envelope, _schema) {
  const result = _validateEnvelope(envelope, { computeMetrics: true });
  return {
    valid: result.valid,
    schemaErrors: result.schemaErrors,
    semanticErrors: result.semanticErrors,
    metrics: result.metrics,
    warnings: [...result.semanticWarnings, ...result.metricWarnings],
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === "compute-inline") {
    // node reference/tteop.mjs compute-inline <input> <output> <cache_write> <cache_read>
    const [input, output, cacheWriteStr, cacheReadStr] = args.slice(1);
    if (input === undefined || output === undefined) {
      console.error("Usage: node reference/tteop.mjs compute-inline <input> <output> <cache_write> <cache_read>");
      process.exit(2);
    }
    const telemetry = {
      input: parseInt(input, 10),
      output: parseInt(output, 10),
      cache_write: cacheWriteStr === "null" ? null : parseInt(cacheWriteStr, 10),
      cache_read: cacheReadStr === "null" ? null : parseInt(cacheReadStr, 10),
    };
    const { metrics, warnings } = _computeMetrics(telemetry);
    console.log(JSON.stringify({ telemetry, metrics, warnings }, null, 2));
    process.exit(0);
  }

  if (mode === "compute") {
    // node reference/tteop.mjs compute <telemetry.json>
    const file = args[1];
    if (!file) {
      console.error("Usage: node reference/tteop.mjs compute <telemetry.json>");
      process.exit(2);
    }
    const telemetry = JSON.parse(readFileSync(file, "utf8"));
    const { metrics, warnings } = _computeMetrics(telemetry);
    console.log(JSON.stringify({ telemetry, metrics, warnings }, null, 2));
    process.exit(0);
  }

  if (mode === "validate") {
    // node reference/tteop.mjs validate <envelope.json>
    const file = args[1];
    if (!file) {
      console.error("Usage: node reference/tteop.mjs validate <envelope.json>");
      process.exit(2);
    }
    const envelope = JSON.parse(readFileSync(file, "utf8"));
    const result = _validateEnvelope(envelope, { computeMetrics: true });
    console.log(JSON.stringify({
      valid: result.valid,
      schemaErrors: result.schemaErrors,
      semanticErrors: result.semanticErrors,
      metrics: result.metrics,
      warnings: [...result.semanticWarnings, ...result.metricWarnings],
    }, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  console.error("Usage: node reference/tteop.mjs <validate|compute|compute-inline> <args>");
  process.exit(2);
}

// Export for use as a module; run CLI only when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

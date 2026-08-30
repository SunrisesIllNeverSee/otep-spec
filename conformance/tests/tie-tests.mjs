/**
 * conformance/tests/tie-tests.mjs — Cross-implementation banker's rounding tie tests.
 *
 * SRP-METRIC-002 requires round-half-to-even (banker's rounding), NOT
 * round-half-up (as produced by Number(n.toFixed(d))).
 *
 * This suite exercises exact .5 ties at each metric's decimal precision and
 * runs the same tie vectors against four implementations:
 *   1. Reference JS   (reference/tteop.mjs computeMetrics)
 *   2. TypeScript      (integrations/typescript/example.ts computeMetrics)
 *   3. CLI             (integrations/cli/example.mjs)
 *   4. Python          (integrations/python/example.py compute_metrics)
 *
 * Tie vectors are constructed with power-of-2 denominators so that the raw
 * metric values are exactly representable in IEEE-754 double precision,
 * guaranteeing genuine .5 ties (not floating-point approximations).
 *
 * Usage:
 *   node conformance/tests/tie-tests.mjs
 *
 * Exit code 0 = all implementations pass. Exit code 1 = one or more failures.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ─── Implementations ─────────────────────────────────────────────────────────

// 1. Reference JS
const { computeMetrics: refCompute, roundHalfToEven } = await import(
  join(ROOT, "reference", "tteop.mjs")
);

// 2. TypeScript (Node >= 22 runs .ts natively)
const { computeMetrics: tsCompute } = await import(
  join(ROOT, "integrations", "typescript", "example.ts")
);

// 3. CLI — spawn a subprocess and parse JSON output
function cliCompute(telemetry) {
  const args = [
    "node",
    join(ROOT, "integrations", "cli", "example.mjs"),
    "--input", String(telemetry.input),
    "--output", String(telemetry.output),
  ];
  if (telemetry.cache_write !== undefined && telemetry.cache_write !== null) {
    args.push("--cache-write", String(telemetry.cache_write));
  } else {
    args.push("--cache-write", "null");
  }
  if (telemetry.cache_read !== undefined && telemetry.cache_read !== null) {
    args.push("--cache-read", String(telemetry.cache_read));
  } else {
    args.push("--cache-read", "null");
  }
  const stdout = execSync(args.join(" "), { encoding: "utf8", cwd: ROOT });
  const envelope = JSON.parse(stdout);
  return { metrics: envelope.metrics, warnings: envelope.warnings };
}

// 4. Python — spawn python3 with a temp script file and parse JSON output
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const _pyDir = mkdtempSync(join(tmpdir(), "tie-test-"));
const _pyScriptPath = join(_pyDir, "run_tie.py");
writeFileSync(
  _pyScriptPath,
  `import json, sys
sys.path.insert(0, ${JSON.stringify(join(ROOT, "integrations", "python"))})
from example import compute_metrics
t = json.loads(sys.stdin.read())
result = compute_metrics(t["input"], t["output"], t.get("cache_write"), t.get("cache_read"))
print(json.dumps(result))
`
);

function pyCompute(telemetry) {
  const stdin = JSON.stringify({
    input: telemetry.input,
    output: telemetry.output,
    cache_write: telemetry.cache_write ?? null,
    cache_read: telemetry.cache_read ?? null,
  });
  const stdout = execSync(`python3 ${JSON.stringify(_pyScriptPath)}`, {
    encoding: "utf8",
    cwd: ROOT,
    input: stdin,
  });
  return JSON.parse(stdout);
}

const implementations = {
  "Reference JS": refCompute,
  "TypeScript": tsCompute,
  "CLI": cliCompute,
  "Python": pyCompute,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assertEqual(actual, expected, label, impl) {
  // Use exact equality for rounded values; null-safe
  const aOk = actual === null || typeof actual === "number";
  const ok = aOk && actual === expected;
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push(`[${impl}] ${label}: expected ${expected}, got ${actual}`);
  }
  return ok;
}

// ─── Part 1: Direct roundHalfToEven sanity (0.5→0, 1.5→2, 2.5→2) ─────────────
// These are the canonical banker's rounding examples at 0 decimal places.

console.log("=== Part 1: roundHalfToEven sanity (0 decimals) ===\n");

const sanityCases = [
  { value: 0.5, decimals: 0, expected: 0 }, // 0 is even
  { value: 1.5, decimals: 0, expected: 2 }, // 2 is even
  { value: 2.5, decimals: 0, expected: 2 }, // 2 is even
  { value: 3.5, decimals: 0, expected: 4 }, // 4 is even
  { value: 4.5, decimals: 0, expected: 4 }, // 4 is even
];

for (const c of sanityCases) {
  const result = roundHalfToEven(c.value, c.decimals);
  const ok = assertEqual(
    result,
    c.expected,
    `roundHalfToEven(${c.value}, ${c.decimals})`,
    "Reference JS"
  );
  console.log(`  ${ok ? "✓" : "✗"} roundHalfToEven(${c.value}, 0) = ${result} (expected ${c.expected})`);
}

// ─── Part 2: Metric-precision tie vectors ────────────────────────────────────
//
// Each vector is designed so that the named metric's raw value lands on an
// exact .5 tie at the metric's decimal precision.  Denominators are powers of
// two so the raw value is exactly representable in double precision.
//
// Metric precisions:
//   yield:           2 decimals
//   leverage:        1 decimal
//   velocity:        3 decimals
//   output_fraction: 4 decimals
//   log_leverage:    2 decimals  (exact ties not constructible with integer
//                                  inputs — consistency check only)

console.log("\n=== Part 2: Metric-precision tie vectors ===\n");

// Leverage ties (1 decimal) — input = 4 (power of 2)
//   leverage = cache_read / 4
//   1/4 = 0.25 → 0.2 (2.5 scaled, even)
//   3/4 = 0.75 → 0.8 (7.5 scaled, even→8)
//   5/4 = 1.25 → 1.2 (12.5 scaled, even)
const leverageTies = [
  { telemetry: { input: 4, output: 1, cache_write: 1, cache_read: 1 },
    metric: "leverage", expected: 0.2 },
  { telemetry: { input: 4, output: 1, cache_write: 1, cache_read: 3 },
    metric: "leverage", expected: 0.8 },
  { telemetry: { input: 4, output: 1, cache_write: 1, cache_read: 5 },
    metric: "leverage", expected: 1.2 },
];

// Velocity ties (3 decimals) — input = 16 (power of 2, exact in IEEE-754)
//   velocity = output / 16
//   1/16 = 0.0625  → 0.062 (62.5 scaled, even→62)
//   3/16 = 0.1875  → 0.188 (187.5 scaled, odd→188)
//   5/16 = 0.3125  → 0.312 (312.5 scaled, even→312)
const velocityTies = [
  { telemetry: { input: 16, output: 1, cache_write: 1, cache_read: 16 },
    metric: "velocity", expected: 0.062 },
  { telemetry: { input: 16, output: 3, cache_write: 1, cache_read: 16 },
    metric: "velocity", expected: 0.188 },
  { telemetry: { input: 16, output: 5, cache_write: 1, cache_read: 16 },
    metric: "velocity", expected: 0.312 },
];

// Output_fraction ties (4 decimals) — input + output = 32 (power of 2)
//   of = output / 32
//   1/32 = 0.03125  → 0.0312 (312.5 scaled, even→312)
//   3/32 = 0.09375  → 0.0938 (937.5 scaled, odd→938)
//   5/32 = 0.15625  → 0.1562 (1562.5 scaled, even→1562)
const outputFractionTies = [
  { telemetry: { input: 31, output: 1, cache_write: 1, cache_read: 1 },
    metric: "output_fraction", expected: 0.0312 },
  { telemetry: { input: 29, output: 3, cache_write: 1, cache_read: 1 },
    metric: "output_fraction", expected: 0.0938 },
  { telemetry: { input: 27, output: 5, cache_write: 1, cache_read: 1 },
    metric: "output_fraction", expected: 0.1562 },
];

// Yield ties (2 decimals) — input = 4, output = 2 (powers of 2)
//   yield = leverage × velocity = (cache_read/4) × (2/4) = cache_read × 2 / 16
//   1×2/16 = 0.125  → 0.12 (12.5 scaled, even→12)
//   3×2/16 = 0.375  → 0.38 (37.5 scaled, odd→38)
//   5×2/16 = 0.625  → 0.62 (62.5 scaled, even→62)
const yieldTies = [
  { telemetry: { input: 4, output: 2, cache_write: 1, cache_read: 1 },
    metric: "yield", expected: 0.12 },
  { telemetry: { input: 4, output: 2, cache_write: 1, cache_read: 3 },
    metric: "yield", expected: 0.38 },
  { telemetry: { input: 4, output: 2, cache_write: 1, cache_read: 5 },
    metric: "yield", expected: 0.62 },
];

// log_leverage — exact .5 ties are not constructible with integer inputs
// (log10 of a rational is generally irrational).  Instead we verify that all
// implementations agree on the rounded value for a standard vector.
const logLeverageConsistency = [
  { telemetry: { input: 1000, output: 500, cache_write: 200, cache_read: 3162 },
    metric: "log_leverage", expected: null }, // expected filled from reference below
];

const allTieVectors = [
  ...leverageTies,
  ...velocityTies,
  ...outputFractionTies,
  ...yieldTies,
];

// Fill in log_leverage expected from the reference implementation
{
  const refResult = refCompute(logLeverageConsistency[0].telemetry);
  logLeverageConsistency[0].expected = refResult.metrics.log_leverage;
}

// ─── Run tie vectors against all implementations ─────────────────────────────

function runTieVector(vector, implName, computeFn) {
  const { telemetry, metric, expected } = vector;
  let result;
  try {
    result = computeFn(telemetry);
  } catch (err) {
    failed++;
    failures.push(`[${implName}] ${metric} tie vector threw: ${err.message}`);
    console.log(`  ✗ [${implName}] ${metric}: threw ${err.message}`);
    return;
  }
  const actual = result.metrics[metric];
  const ok = assertEqual(actual, expected, `${metric} tie`, implName);
  const t = vector.telemetry;
  console.log(
    `  ${ok ? "✓" : "✗"} [${implName}] ${metric}` +
    ` (I=${t.input}, O=${t.output}, W=${t.cache_write}, R=${t.cache_read})` +
    ` = ${actual} (expected ${expected})`
  );
}

for (const [implName, computeFn] of Object.entries(implementations)) {
  console.log(`\n--- ${implName} ---`);
  for (const vector of allTieVectors) {
    runTieVector(vector, implName, computeFn);
  }
  // log_leverage consistency check
  console.log(`  (log_leverage consistency)`);
  runTieVector(logLeverageConsistency[0], implName, computeFn);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n=== Summary ===\n");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  ✗ ${f}`);
  }
}

console.log(
  `\n${failed === 0 ? "ALL IMPLEMENTATIONS PASS — banker's rounding confirmed across JS/TS/CLI/Python" : "TIE TEST FAILURES DETECTED"}`
);

if (failed > 0) {
  process.exit(1);
}

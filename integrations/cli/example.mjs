#!/usr/bin/env node
/**
 * integrations/cli/example.mjs
 *
 * Minimal CLI that computes an OTEP v0.1-draft record from
 * command-line arguments. No dependencies.
 *
 * Usage:
 *   node integrations/cli/example.mjs --input 1251211 --output 11296121 --cache-write 128196310 --cache-read 2555179769
 */

import { computeMetrics } from "../typescript/example.ts";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const val = args[idx + 1];
  return val === undefined ? undefined : Number(val);
}

const input = getArg("input");
const output = getArg("output");
const cacheWrite = getArg("cache-write") ?? null;
const cacheRead = getArg("cache-read") ?? null;

if (input === undefined || output === undefined) {
  console.error("Usage: node integrations/cli/example.mjs --input <I> --output <O> [--cache-write <W>] [--cache-read <R>]");
  process.exit(1);
}

const { metrics, warnings } = computeMetrics({ input, output, cache_write: cacheWrite, cache_read: cacheRead });
const record = {
  spec: "otep/0.1-draft",
  timestamp: new Date().toISOString(),
  source: { provider: "cli", model: "cli", tool: "sigrank-standard-cli" },
  telemetry: { input, output, cache_write: cacheWrite, cache_read: cacheRead },
  metrics,
  warnings,
};

console.log(JSON.stringify(record, null, 2));

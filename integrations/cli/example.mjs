#!/usr/bin/env node
/**
 * integrations/cli/example.mjs
 *
 * Minimal CLI that computes an TTEOP v0.1-draft schema-conforming envelope
 * from command-line arguments. No dependencies.
 *
 * Imports the TypeScript reference implementation directly (example.ts).
 * Requires Node.js 22+ which has native TypeScript stripping support.
 * No compilation step is needed.
 *
 * Usage:
 *   node integrations/cli/example.mjs --input 1251211 --output 11296121 --cache-write 128196310 --cache-read 2555179769
 */

import { buildEnvelope } from "../typescript/example.ts";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const val = args[idx + 1];
  if (val === undefined || val.startsWith("--")) return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}

const input = getArg("input");
const output = getArg("output");
const cacheWrite = getArg("cache-write") ?? null;
const cacheRead = getArg("cache-read") ?? null;

if (input === undefined || output === undefined) {
  console.error("Usage: node integrations/cli/example.mjs --input <I> --output <O> [--cache-write <W>] [--cache-read <R>]");
  process.exit(1);
}

const envelope = buildEnvelope(
  { input, output, cache_write: cacheWrite, cache_read: cacheRead },
  { tool: "cli", provider: null, model: null }
);

console.log(JSON.stringify(envelope, null, 2));

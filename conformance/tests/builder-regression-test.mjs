#!/usr/bin/env node
/**
 * conformance/tests/builder-regression-test.mjs
 *
 * Regression coverage for default-builder missingness semantics (C2).
 * Verifies that every public builder surface (TS, CLI, MCP) produces
 * schema-valid envelopes when cache values are null.
 *
 * License: Apache-2.0
 */

import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const VALIDATE = join(ROOT, "conformance", "tteop-validate.mjs");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function validateEnvelope(envelope, label) {
  const tmpDir = mkdtempSync(join(tmpdir(), "tteop-reg-"));
  const filePath = join(tmpDir, "envelope.json");
  writeFileSync(filePath, JSON.stringify(envelope, null, 2));
  try {
    const output = execSync(`node ${VALIDATE} ${filePath} --report text`, {
      encoding: "utf8", cwd: ROOT, stdio: "pipe",
    });
    const isPass = output.includes("Overall: PASS");
    assert(isPass, `${label}: envelope validates (Overall: PASS)`);
    if (!isPass) console.log(`    Output: ${output.split("\n").slice(0, 5).join(" | ")}`);
    return isPass;
  } catch (e) {
    const output = e.stdout || e.stderr || e.message;
    assert(false, `${label}: envelope validates — ${output.split("\n")[0]}`);
    return false;
  }
}

async function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "tteop-reg-"));

  console.log("=== TS builder: null cache missingness ===\n");

  // Import the TS builder
  const { buildEnvelope } = await import(join(ROOT, "integrations", "typescript", "example.ts"));

  // 1. Both cache null
  const bothNull = buildEnvelope(
    { input: 100, output: 200, cache_write: null, cache_read: null },
    { tool: "test" }
  );
  assert(bothNull.validity?.missingness_flags?.includes("cache_write_not_reported"),
    "TS: null cache_write emits cache_write_not_reported flag");
  assert(bothNull.validity?.missingness_flags?.includes("cache_read_not_reported"),
    "TS: null cache_read emits cache_read_not_reported flag");
  validateEnvelope(bothNull, "TS both-null-cache");

  // 2. Only cache_write null
  const writeNull = buildEnvelope(
    { input: 100, output: 200, cache_write: null, cache_read: 500 },
    { tool: "test" }
  );
  assert(writeNull.validity?.missingness_flags?.includes("cache_write_not_reported"),
    "TS: null cache_write only emits flag");
  assert(!writeNull.validity?.missingness_flags?.includes("cache_read_not_reported"),
    "TS: non-null cache_read does NOT emit flag");
  validateEnvelope(writeNull, "TS write-null-cache");

  // 3. Only cache_read null
  const readNull = buildEnvelope(
    { input: 100, output: 200, cache_write: 300, cache_read: null },
    { tool: "test" }
  );
  assert(readNull.validity?.missingness_flags?.includes("cache_read_not_reported"),
    "TS: null cache_read only emits flag");
  assert(!readNull.validity?.missingness_flags?.includes("cache_write_not_reported"),
    "TS: non-null cache_write does NOT emit flag");
  validateEnvelope(readNull, "TS read-null-cache");

  // 4. Full cache — no missingness flags
  const fullCache = buildEnvelope(
    { input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769 },
    { tool: "claude-code", provider: "anthropic", model: "claude-sonnet-4" }
  );
  assert(!fullCache.validity || (fullCache.validity?.missingness_flags?.length ?? 0) === 0,
    "TS: full cache does NOT emit missingness flags");
  validateEnvelope(fullCache, "TS full-cache");

  console.log("\n=== CLI builder: null cache missingness ===\n");

  // CLI with no cache args → null cache
  const cliOutput = execSync(
    `node ${join(ROOT, "integrations", "cli", "example.mjs")} --input 100 --output 200`,
    { encoding: "utf8", cwd: ROOT }
  );
  const cliEnvelope = JSON.parse(cliOutput);
  assert(cliEnvelope.validity?.missingness_flags?.includes("cache_write_not_reported"),
    "CLI: null cache_write emits flag");
  assert(cliEnvelope.validity?.missingness_flags?.includes("cache_read_not_reported"),
    "CLI: null cache_read emits flag");
  validateEnvelope(cliEnvelope, "CLI both-null-cache");

  // CLI with full cache
  const cliFullOutput = execSync(
    `node ${join(ROOT, "integrations", "cli", "example.mjs")} --input 1251211 --output 11296121 --cache-write 128196310 --cache-read 2555179769`,
    { encoding: "utf8", cwd: ROOT }
  );
  const cliFullEnvelope = JSON.parse(cliFullOutput);
  validateEnvelope(cliFullEnvelope, "CLI full-cache");

  console.log("\n=== MCP builder: null cache via tools/call ===\n");

  // MCP via JSON-RPC tools/call
  const mcpRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "get_tteop_record",
      arguments: { input: 100, output: 200, tool: "mcp-test" },
    },
  });
  const mcpResponse = execSync(
    `echo '${mcpRequest}' | node ${join(ROOT, "integrations", "mcp", "example.mjs")}`,
    { encoding: "utf8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }
  );
  const mcpResult = JSON.parse(mcpResponse.trim());
  assert(mcpResult.jsonrpc === "2.0", "MCP: response is JSON-RPC 2.0");
  assert(mcpResult.id === 1, "MCP: response id matches request");
  assert(mcpResult.result?.content?.[0]?.type === "text", "MCP: result has text content");
  const mcpEnvelope = JSON.parse(mcpResult.result.content[0].text);
  assert(mcpEnvelope.validity?.missingness_flags?.includes("cache_write_not_reported"),
    "MCP: null cache_write emits flag");
  assert(mcpEnvelope.validity?.missingness_flags?.includes("cache_read_not_reported"),
    "MCP: null cache_read emits flag");
  validateEnvelope(mcpEnvelope, "MCP both-null-cache");

  // MCP with full cache
  const mcpFullRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_tteop_record",
      arguments: { input: 1251211, output: 11296121, cache_write: 128196310, cache_read: 2555179769, tool: "mcp-test" },
    },
  });
  const mcpFullResponse = execSync(
    `echo '${mcpFullRequest}' | node ${join(ROOT, "integrations", "mcp", "example.mjs")}`,
    { encoding: "utf8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }
  );
  const mcpFullResult = JSON.parse(mcpFullResponse.trim());
  const mcpFullEnvelope = JSON.parse(mcpFullResult.result.content[0].text);
  validateEnvelope(mcpFullEnvelope, "MCP full-cache");

  // MCP tools/list
  console.log("\n=== MCP tools/list ===\n");
  const listRequest = JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" });
  const listResponse = execSync(
    `echo '${listRequest}' | node ${join(ROOT, "integrations", "mcp", "example.mjs")}`,
    { encoding: "utf8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] }
  );
  const listResult = JSON.parse(listResponse.trim());
  assert(listResult.result?.tools?.length === 1, "MCP: tools/list returns 1 tool");
  assert(listResult.result?.tools?.[0]?.name === "get_tteop_record", "MCP: tool name is get_tteop_record");

  // Summary
  console.log(`\n=== Summary ===\n`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
  }
  console.log(`\n${failed === 0 ? "ALL BUILDER REGRESSION TESTS PASS" : "BUILDER REGRESSION FAILURES DETECTED"}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});

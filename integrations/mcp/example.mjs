/**
 * integrations/mcp/example.mjs
 *
 * Minimal MCP server that exposes the TTEOP v0.1-draft
 * as a single tool: get_tteop_record.
 *
 * Imports the TypeScript reference implementation directly (example.ts).
 * Requires Node.js 22.6+ with --experimental-strip-types (stable in Node 22.7+).
 * The CI workflow pins node-version: 22. No compilation step is needed.
 *
 * Emits schema-conforming envelopes per schemas/telemetry-envelope-v0.1.schema.json.
 */

import { buildEnvelope } from "../typescript/example.ts";

const TOOL_DEF = {
  name: "get_tteop_record",
  description: "Build an TTEOP v0.1-draft schema-conforming envelope from token telemetry. Computes Yield, Leverage, Velocity, output_fraction, and log_leverage. No data is submitted or persisted.",
  inputSchema: {
    type: "object",
    required: ["input", "output"],
    properties: {
      input: { type: "integer", minimum: 0, description: "Fresh input tokens." },
      output: { type: "integer", minimum: 0, description: "Output tokens." },
      cache_write: { type: ["integer", "null"], minimum: 0, description: "Cache-write tokens, or null when unavailable." },
      cache_read: { type: ["integer", "null"], minimum: 0, description: "Cache-read tokens, or null when unavailable." },
      tool: { type: "string", description: "AI tool name (e.g., 'claude-code')." },
      provider: { type: "string", description: "Provider name (e.g., 'anthropic')." },
      model: { type: "string", description: "Model identifier (e.g., 'claude-sonnet-4')." },
      privacy_mode: { type: "string", enum: ["public-pseudonymous", "private-managed-cohort", "enterprise-isolated"] },
    },
  },
};

// JSON-RPC 2.0 error codes (per spec §5.1)
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INTERNAL_ERROR = -32603;

const MAX_SAFE_INTEGER = 9007199254740991;

function sendError(id, code, message, data) {
  const err = { code, message };
  if (data !== undefined) err.data = data;
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: err }) + "\n");
}

/**
 * Validate a token field: must be a non-negative safe integer.
 * Returns the validated value or null if explicitly null.
 * Throws an error string if invalid.
 */
function validateTokenField(value, fieldName) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw `${fieldName} must be an integer, got ${typeof value === "number" ? value : typeof value}`;
  }
  if (value < 0) {
    throw `${fieldName} must be non-negative, got ${value}`;
  }
  if (value > MAX_SAFE_INTEGER) {
    throw `${fieldName} exceeds MAX_SAFE_INTEGER, got ${value}`;
  }
  return value;
}

function handleRequest(msg) {
  if (msg.method === "tools/list") {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: { tools: [TOOL_DEF] },
    }) + "\n");
  } else if (msg.method === "tools/call" && msg.params?.name === "get_tteop_record") {
    const args = msg.params.arguments ?? {};
    // Validate all token fields before calling buildEnvelope
    let input, output, cacheWrite, cacheRead;
    try {
      input = validateTokenField(args.input, "input");
      output = validateTokenField(args.output, "output");
      if (input === null) throw "input is required and must be a non-negative integer";
      if (output === null) throw "output is required and must be a non-negative integer";
      cacheWrite = validateTokenField(args.cache_write, "cache_write");
      cacheRead = validateTokenField(args.cache_read, "cache_read");
    } catch (e) {
      sendError(msg.id, INVALID_REQUEST, `tools/call argument error: ${e}`);
      return;
    }
    const envelope = buildEnvelope(
      {
        input,
        output,
        cache_write: cacheWrite,
        cache_read: cacheRead,
      },
      {
        tool: args.tool || "unknown",
        provider: args.provider || null,
        model: args.model || null,
        privacy_mode: args.privacy_mode || "public-pseudonymous",
      }
    );
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: msg.id,
      result: { content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }] },
    }) + "\n");
  } else if (msg.method === "tools/call") {
    sendError(msg.id, METHOD_NOT_FOUND, `Unknown tool: ${msg.params?.name}`);
  } else {
    sendError(msg.id, METHOD_NOT_FOUND, `Unknown method: ${msg.method}`);
  }
}

process.stdin.on("data", (data) => {
  const text = data.toString().trim();
  if (!text) return; // ignore empty input (e.g. trailing whitespace/newlines)
  let msg;
  try {
    msg = JSON.parse(text);
  } catch (e) {
    // Per JSON-RPC 2.0 §5.1: parse errors get id: null and code -32700
    sendError(null, PARSE_ERROR, `Parse error: ${e.message}`);
    return;
  }
  // Validate it is a JSON-RPC 2.0 request object.
  // JSON.parse("null"), JSON.parse("[]"), JSON.parse("42") etc. are valid JSON
  // but not valid JSON-RPC request objects. Reject before property access.
  if (msg === null || typeof msg !== "object" || Array.isArray(msg)) {
    sendError(null, INVALID_REQUEST, "Invalid JSON-RPC 2.0 request: expected an object");
    return;
  }
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    sendError(msg?.id ?? null, INVALID_REQUEST, "Invalid JSON-RPC 2.0 request");
    return;
  }
  try {
    handleRequest(msg);
  } catch (e) {
    sendError(msg.id, INTERNAL_ERROR, e.message);
  }
});

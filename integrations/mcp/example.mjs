/**
 * integrations/mcp/example.mjs
 *
 * Minimal MCP server that exposes the TTEOP v0.1-draft
 * as a single tool: get_tteop_record.
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

function sendError(id, code, message, data) {
  const err = { code, message };
  if (data !== undefined) err.data = data;
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: err }) + "\n");
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
    if (typeof args.input !== "number" || typeof args.output !== "number") {
      sendError(msg.id, INVALID_REQUEST, "tools/call requires integer 'input' and 'output' arguments");
      return;
    }
    const envelope = buildEnvelope(
      {
        input: args.input,
        output: args.output,
        cache_write: args.cache_write ?? null,
        cache_read: args.cache_read ?? null,
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
  // Validate it is a JSON-RPC 2.0 request
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

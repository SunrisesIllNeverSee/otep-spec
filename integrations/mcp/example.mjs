/**
 * integrations/mcp/example.mjs
 *
 * Minimal MCP server that exposes the OTEP v0.1-draft
 * as a single tool: get_otep_record.
 *
 * Emits schema-conforming envelopes per schemas/telemetry-envelope-v0.1.schema.json.
 */

import { buildEnvelope } from "../typescript/example.ts";

const TOOL_DEF = {
  name: "get_otep_record",
  description: "Build an OTEP v0.1-draft schema-conforming envelope from token telemetry. Computes Yield, Leverage, Velocity, output_fraction, and log_leverage. No data is submitted or persisted.",
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

process.stdin.on("data", (data) => {
  try {
    const msg = JSON.parse(data.toString().trim());
    if (msg.method === "tools/list") {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: { tools: [TOOL_DEF] },
      }) + "\n");
    } else if (msg.method === "tools/call" && msg.params?.name === "get_otep_record") {
      const args = msg.params.arguments;
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
    }
  } catch {
    // Ignore malformed input
  }
});

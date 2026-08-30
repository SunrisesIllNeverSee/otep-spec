/**
 * integrations/mcp/example.mjs
 *
 * Minimal MCP server that exposes the OTEP v0.1-draft
 * as a single tool: get_otep_record.
 *
 * This is a reference implementation showing how any MCP server can
 * implement the standard without depending on SignalAF code.
 */

import { computeMetrics } from "../typescript/example.ts";

const TOOL_DEF = {
  name: "get_otep_record",
  description: "Build an OTEP v0.1-draft portable operator record from token telemetry. Computes Yield, Leverage, Velocity, output_fraction, and log_leverage. No data is submitted or persisted.",
  inputSchema: {
    type: "object",
    required: ["input", "output"],
    properties: {
      input: { type: "integer", minimum: 0, description: "Fresh input tokens." },
      output: { type: "integer", minimum: 0, description: "Output tokens." },
      cache_write: { type: ["integer", "null"], minimum: 0, description: "Cache-write tokens, or null when unavailable." },
      cache_read: { type: ["integer", "null"], minimum: 0, description: "Cache-read tokens, or null when unavailable." },
    },
  },
};

// MCP stdio protocol handler (simplified)
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
      const { metrics, warnings } = computeMetrics(args);
      const record = {
        spec: "otep/0.1-draft",
        timestamp: new Date().toISOString(),
        source: { provider: args.provider || "unknown", model: args.model || "unknown", tool: args.tool || "unknown" },
        telemetry: {
          input: args.input,
          output: args.output,
          cache_write: args.cache_write ?? null,
          cache_read: args.cache_read ?? null,
        },
        metrics,
        warnings,
      };
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] },
      }) + "\n");
    }
  } catch {
    // Ignore malformed input
  }
});

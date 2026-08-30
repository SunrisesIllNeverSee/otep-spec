#!/usr/bin/env node
/**
 * bin/tteop.mjs — TTEOP CLI entry point.
 *
 * Implements the documented CLI contract from conformance/classes.md:
 *
 *   tteop validate <payload.json>
 *     [--profile <privacy-mode>]
 *     [--class <conformance-class>]
 *     [--report <json|text|sarif>]
 *
 *   tteop help
 *   tteop version
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = one or more mandatory checks failed
 *   2 = schema validation error
 *   3 = unsupported protocol version
 *   4 = usage error / internal error
 *
 * License: Apache-2.0
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALIDATE_SCRIPT = join(__dirname, "..", "conformance", "tteop-validate.mjs");

const VERSION = "tteop/0.1.0-draft";

function showHelp() {
  console.log(`TTEOP — Token Telemetry Evaluation Operator Protocol

Usage:
  tteop <command> [options]

Commands:
  validate <payload.json>   Validate a TTEOP telemetry envelope
  help                      Show this help message
  version                   Show version information

Validate options:
  --profile <mode>          Expected privacy profile (asserts envelope matches)
                             (public-pseudonymous|private-managed-cohort|enterprise-isolated)
  --class <class>           Conformance class
                             (producer|consumer|adapter|metric-engine|privacy-profile|full-platform)
                             default: full-platform
  --report <format>         Output format (json|text|sarif)
                             default: text

Exit codes:
  0 = all checks passed
  1 = one or more mandatory checks failed
  2 = schema validation error
  3 = unsupported protocol version
  4 = usage error / internal error

Examples:
  tteop validate envelope.json
  tteop validate envelope.json --profile public-pseudonymous --report json
  tteop validate envelope.json --class schema-only --report sarif
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    showHelp();
    process.exit(0);
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log(VERSION);
    process.exit(0);
  }

  if (command === "validate") {
    const validateArgs = args.slice(1);
    if (validateArgs.length === 0) {
      console.error("Error: validate requires a payload file path");
      console.error("Usage: tteop validate <payload.json> [options]");
      process.exit(4);
    }
    // Spawn the validate script with the remaining args
    const child = spawn("node", [VALIDATE_SCRIPT, ...validateArgs], {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    child.on("exit", (code) => {
      process.exit(code ?? 1);
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error("Run 'tteop help' for usage information.");
  process.exit(4);
}

main();

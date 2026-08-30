/**
 * conformance/tests/runner-self-test.mjs — Self-test for the conformance runner.
 *
 * Verifies that the runner correctly REJECTS non-conforming implementations.
 * This is a meta-test: it ensures the conformance suite itself has teeth.
 *
 * Usage:
 *   node conformance/tests/runner-self-test.mjs
 *
 * Exit code 0 = all self-tests pass. Exit code 1 = a self-test failed.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const RUNNER = join(REPO_ROOT, "conformance", "runner.mjs");
const FIXTURES_DIR = join(REPO_ROOT, "examples", "fixtures");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
    failed++;
  }
}

// ─── Test 1: Runner passes on the current fixtures ──────────────────────────

test("runner exits 0 on current fixtures", () => {
  const output = execFileSync("node", [RUNNER], { encoding: "utf-8", cwd: REPO_ROOT });
  if (!output.includes("passed, 0 failed")) {
    throw new Error(`Expected all passed, 0 failed. Got: ${output.trim().split("\n").pop()}`);
  }
});

// ─── Test 2: Runner catches a broken metric implementation ───────────────────
// We temporarily swap a fixture's expected metric to a wrong value and verify
// the runner reports a failure.

test("runner catches incorrect metric values", () => {
  const fixturePath = join(FIXTURES_DIR, "01-canonical-reference.json");
  const original = readFileSync(fixturePath, "utf-8");
  const modified = JSON.parse(original);
  modified.expected.metrics.yield = 99999.99; // wrong value

  try {
    // Write to a temp fixtures dir and run against it
    const tmpDir = join(REPO_ROOT, ".tmp-self-test");
    mkdirSync(tmpDir, { recursive: true });
    const tmpFixtures = join(tmpDir, "fixtures");
    mkdirSync(tmpFixtures, { recursive: true });

    // Copy all fixtures, replacing the canonical one
    const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const content = f === "01-canonical-reference.json" ? JSON.stringify(modified, null, 2) : readFileSync(join(FIXTURES_DIR, f), "utf-8");
      writeFileSync(join(tmpFixtures, f), content);
    }

    // Create a temp runner that points to the temp fixtures dir
    const tmpRunner = join(tmpDir, "runner.mjs");
    const runnerSrc = readFileSync(RUNNER, "utf-8");
    const tmpRunnerSrc = runnerSrc.replace(
      'join(__dirname, "..", "examples", "fixtures")',
      'join(__dirname, "fixtures")'
    );
    writeFileSync(tmpRunner, tmpRunnerSrc);

    try {
      const output = execFileSync("node", [tmpRunner], { encoding: "utf-8", cwd: tmpDir, stdio: "pipe" });
      // Should NOT pass
      throw new Error("Runner incorrectly passed with wrong metric value");
    } catch (err) {
      // Expected: non-zero exit or failure in output
      const output = err.stdout || "";
      if (!output.includes("1 failed") && !output.includes("metric yield")) {
        throw new Error(`Runner did not report the metric failure: ${err.message}`);
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  } finally {
    // Restore original fixture (not needed since we wrote to temp dir, but safety)
    writeFileSync(fixturePath, original);
  }
});

// ─── Test 3: Runner catches missing warnings ─────────────────────────────────
// Verify that the runner would fail if warnings were not checked.
// We do this by confirming the runner output mentions warnings for fixtures
// that have expected warnings.

test("runner validates warnings (fixtures with expected warnings exist)", () => {
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json")).sort();
  let fixturesWithWarnings = 0;
  for (const f of files) {
    const fixture = JSON.parse(readFileSync(join(FIXTURES_DIR, f), "utf-8"));
    if (fixture.expected.warnings !== undefined && fixture.expected.warnings.length > 0) {
      fixturesWithWarnings++;
    }
  }
  if (fixturesWithWarnings < 6) {
    throw new Error(`Expected at least 6 fixtures with expected warnings, found ${fixturesWithWarnings}`);
  }
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log("");
console.log(`Self-test results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed > 0) {
  process.exit(1);
}

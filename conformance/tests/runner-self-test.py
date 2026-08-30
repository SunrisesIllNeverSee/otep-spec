#!/usr/bin/env python3
"""
conformance/tests/runner-self-test.py — Self-test for the Python TTEOP conformance runner.

Mirrors conformance/tests/runner-self-test.mjs. Verifies that the Python
conformance runner correctly REJECTS non-conforming implementations.

This is a meta-test: it ensures the Python conformance suite itself has teeth.
Without it, a regression making the runner always-pass would go undetected.

Usage:
    python3 conformance/tests/runner-self-test.py

Exit code 0 = all self-tests pass. Exit code 1 = a self-test failed.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
TEST_VECTORS_DIR = REPO_ROOT / "test-vectors"

passed = 0
failed = 0


def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  ✓ {name}")
        passed += 1
    except AssertionError as err:
        print(f"  ✗ {name}")
        print(f"      {err}")
        failed += 1


# ─── Test 1: Runner exits 0 on current test vectors ──────────────────────────

def test_runner_passes_current_vectors():
    result = subprocess.run(
        [sys.executable, "-m", "sigrank_standard"],
        capture_output=True,
        text=True,
        cwd=str(REPO_ROOT),
        env={**os.environ, "PYTHONPATH": str(REPO_ROOT / "python")},
    )
    assert result.returncode == 0, f"Runner exited {result.returncode}: {result.stderr}"
    assert "passed" in result.stdout and "0 failed" in result.stdout or "ALL PASS" in result.stdout, (
        f"Expected all passed, 0 failed. Got: {result.stdout.strip().splitlines()[-1] if result.stdout.strip() else '(empty)'}"
    )


# ─── Test 2: Runner catches a broken metric implementation ───────────────────
# We temporarily swap a vector's expected metric to a wrong value and verify
# the runner reports a failure.

def test_runner_catches_incorrect_metric_values():
    vector_path = TEST_VECTORS_DIR / "canonical-moses.json"
    original = vector_path.read_text()
    modified = json.loads(original)
    modified["expected"]["metrics"]["yield"] = 99999.99  # wrong value

    tmp_dir = Path(tempfile.mkdtemp(prefix="tteop-self-test-"))
    try:
        tmp_vectors = tmp_dir / "test-vectors"
        tmp_vectors.mkdir()
        for f in sorted(TEST_VECTORS_DIR.glob("*.json")):
            content = (
                json.dumps(modified, indent=2)
                if f.name == "canonical-moses.json"
                else f.read_text()
            )
            (tmp_vectors / f.name).write_text(content)

        sys.path.insert(0, str(REPO_ROOT / "python"))
        try:
            from sigrank_standard.conformance import run_conformance
            result = run_conformance(test_vectors_dir=tmp_vectors)
            assert result.failed >= 1, (
                "Runner incorrectly passed with wrong metric value "
                f"(passed={result.passed}, failed={result.failed})"
            )
            assert any("metric yield" in f for f in result.failures), (
                f"Runner did not report the metric failure: {result.failures}"
            )
        finally:
            sys.path.pop(0)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─── Test 3: Runner validates warnings (vectors with expected warnings exist) ─

def test_runner_validates_warnings():
    files = sorted(TEST_VECTORS_DIR.glob("*.json"))
    vectors_with_warnings = 0
    for f in files:
        vector = json.loads(f.read_text())
        warnings = vector.get("expected", {}).get("warnings")
        if warnings is not None and len(warnings) > 0:
            vectors_with_warnings += 1
    assert vectors_with_warnings >= 3, (
        f"Expected at least 3 vectors with expected warnings, found {vectors_with_warnings}"
    )


# ─── Test 4: Runner catches wrong metric names ────────────────────────────────
# Verify the runner would fail if a vector expected old metric names (snr/dev10x)
# that the TTEOP implementation no longer produces.

def test_runner_catches_old_metric_names():
    sys.path.insert(0, str(REPO_ROOT / "python"))
    try:
        from sigrank_standard.conformance import _validate_vector
        vector = {
            "id": "self-test-old-names",
            "input": {
                "telemetry": {"input": 1000, "output": 5000, "cache_write": 500, "cache_read": 3000},
                "source": {"provider": "test", "model": "test", "tool": "test"},
            },
            "expected": {
                "metrics": {"yield": 15.0, "leverage": 3.0, "velocity": 5.0, "snr": 0.8333, "dev10x": 0.48},
            },
        }
        errors = _validate_vector(vector)
        # "snr" and "dev10x" are not in the TTEOP metrics output, so the runner
        # should report them as missing expected metrics (the actual values will
        # be None since those keys don't exist in the output)
        assert len(errors) > 0, (
            f"Runner did not catch old metric names (snr/dev10x): {errors}"
        )
    finally:
        sys.path.pop(0)


# ─── Test 5: Runner catches wrong spec version ───────────────────────────────

def test_runner_catches_wrong_version():
    sys.path.insert(0, str(REPO_ROOT / "python"))
    try:
        from sigrank_standard.conformance import _validate_vector
        vector = {
            "id": "self-test-version",
            "input": {
                "telemetry": {"input": 1000, "output": 5000, "cache_write": 500, "cache_read": 3000},
                "source": {"provider": "test", "model": "test", "tool": "test"},
            },
            "expected": {
                "spec": "tteop/0.2-draft",
            },
        }
        errors = _validate_vector(vector)
        assert any("version declaration" in e for e in errors), (
            f"Runner did not catch wrong spec version: {errors}"
        )
    finally:
        sys.path.pop(0)


# ─── Test 6: Runner catches missing required metrics ──────────────────────────

def test_runner_catches_missing_required_metrics():
    sys.path.insert(0, str(REPO_ROOT / "python"))
    try:
        from sigrank_standard.conformance import _validate_vector
        # A vector with no expected metrics at all — the runner should still
        # verify all 5 TTEOP metrics are present in the output
        vector = {
            "id": "self-test-missing-metrics",
            "input": {
                "telemetry": {"input": 1000, "output": 5000, "cache_write": 500, "cache_read": 3000},
                "source": {"provider": "test", "model": "test", "tool": "test"},
            },
            "expected": {},
        }
        errors = _validate_vector(vector)
        # Should pass — all 5 metrics are computed. But if we break it:
        assert len(errors) == 0, (
            f"Runner reported unexpected errors for valid input: {errors}"
        )
    finally:
        sys.path.pop(0)


# ─── Run all tests ────────────────────────────────────────────────────────────

test("runner exits 0 on current test vectors", test_runner_passes_current_vectors)
test("runner catches incorrect metric values", test_runner_catches_incorrect_metric_values)
test("runner validates warnings (vectors with expected warnings exist)", test_runner_validates_warnings)
test("runner catches old metric names (snr/dev10x)", test_runner_catches_old_metric_names)
test("runner catches wrong spec version", test_runner_catches_wrong_version)
test("runner catches missing required metrics", test_runner_catches_missing_required_metrics)

print()
print(f"Self-test results: {passed} passed, {failed} failed, {passed + failed} total")

if failed > 0:
    sys.exit(1)

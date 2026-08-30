"""
Conformance runner for TTEOP v0.1-draft (Token Telemetry Evaluation Operator Protocol).

Loads JSON test vectors from the test-vectors/ directory, computes metrics
using ``compute_metrics``, and validates the output against expected values.

This runner mirrors the authoritative JS runner (``conformance/tteop-runner.mjs``)
validation surface:
  - metric comparison (with tolerance)
  - warning semantics (ordered arrays)
  - null/zero/missing distinction
  - spec version declaration (tteop/0.1-draft)

Usage:
    from sigrank_standard import run_conformance
    result = run_conformance()
    print(f"{result.passed}/{result.total} passed")
"""

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, List, Optional

from .metrics import compute_metrics


SPEC_VERSION = "tteop/0.1-draft"


@dataclass
class ConformanceResult:
    """Result of running the conformance suite."""
    passed: int = 0
    failed: int = 0
    total: int = 0
    failures: List[str] = field(default_factory=list)

    @property
    def all_passed(self) -> bool:
        return self.failed == 0


def _approx_equal(a, b, tolerance: float = 0.001) -> bool:
    """Compare two values, treating None as equal to None."""
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return abs(a - b) < tolerance


def _arrays_equal(a, b) -> bool:
    """Order-sensitive list equality."""
    if len(a) != len(b):
        return False
    for x, y in zip(a, b):
        if x != y:
            return False
    return True


def _find_test_vectors_dir() -> Path:
    """Find the test-vectors directory relative to the package or repo root."""
    here = Path(__file__).parent
    candidates = [
        here.parent.parent / "test-vectors",
        here.parent / "test-vectors",
        Path.cwd() / "test-vectors",
    ]
    for c in candidates:
        if c.is_dir():
            return c
    raise FileNotFoundError(
        "Could not find test-vectors/ directory. "
        "Run from the sigrank-standard repo root or install with test vectors."
    )


# ─── Test vector validation ──────────────────────────────────────────────────

def _validate_vector(vector: dict) -> List[str]:
    """Validate a single TTEOP test vector. Returns list of error strings (empty = pass)."""
    errors: List[str] = []
    vector_id = vector.get("id", "unknown")

    telemetry = vector.get("input", {}).get("telemetry", {})
    expected = vector.get("expected", {})

    # Compute metrics using the TTEOP Python implementation
    result = compute_metrics(
        input_tokens=telemetry.get("input", 0),
        output_tokens=telemetry.get("output", 0),
        cache_write=telemetry.get("cache_write", telemetry.get("cache_creation")),
        cache_read=telemetry.get("cache_read"),
    )

    # 1. Metric comparison — exact values with tolerance
    expected_metrics = expected.get("metrics", {})
    for key, expected_value in expected_metrics.items():
        actual_value = result["metrics"].get(key)
        if not _approx_equal(actual_value, expected_value):
            errors.append(
                f"{vector_id}: metric {key}: expected {expected_value}, got {actual_value}"
            )

    # 2. Warning semantics — warnings must match expected as ordered arrays
    expected_warnings = expected.get("warnings")
    if expected_warnings is not None:
        if not _arrays_equal(result["warnings"], expected_warnings):
            errors.append(
                f"{vector_id}: warnings mismatch:\n"
                f"        expected: {expected_warnings}\n"
                f"        actual:   {result['warnings']}"
            )

    # 3. Spec version — must be tteop/0.1-draft
    expected_spec = expected.get("spec")
    if expected_spec is not None:
        if expected_spec != SPEC_VERSION:
            errors.append(
                f"{vector_id}: version declaration: expected spec \"{expected_spec}\", "
                f"got \"{SPEC_VERSION}\""
            )

    # 4. Required metrics — all five TTEOP metrics must be present
    required_metrics = ["yield", "leverage", "velocity", "output_fraction", "log_leverage"]
    for req in required_metrics:
        if req not in result["metrics"]:
            errors.append(f"{vector_id}: missing required metric: \"{req}\"")

    return errors


def run_conformance(test_vectors_dir: Optional[Path] = None) -> ConformanceResult:
    """
    Run the full conformance suite against all TTEOP test vectors.

    Args:
        test_vectors_dir: Path to the test-vectors directory. If None, auto-discovers.

    Returns:
        ConformanceResult with pass/fail counts and failure details.
    """
    if test_vectors_dir is None:
        test_vectors_dir = _find_test_vectors_dir()

    vector_files = sorted(test_vectors_dir.glob("*.json"))
    result = ConformanceResult(total=len(vector_files))

    for vector_path in vector_files:
        with open(vector_path) as f:
            vector = json.load(f)

        errors = _validate_vector(vector)
        if errors:
            result.failed += 1
            result.failures.extend(errors)
        else:
            result.passed += 1

    return result


def main() -> int:
    """CLI entry point for the conformance runner."""
    result = run_conformance()
    print("TTEOP v0.1-draft Conformance Suite (Python)")
    print(f"{result.total} test vectors loaded")
    print()
    if result.all_passed:
        print(f"Results: {result.passed}/{result.total} passed — ALL PASS")
    else:
        print(f"Results: {result.passed}/{result.total} passed, {result.failed} FAILED")
        for failure in result.failures:
            print(f"  {failure}")
    return 0 if result.all_passed else 1

"""
Tests for the sigrank_standard Python package — TTEOP v0.1-draft.

Tests both build_envelope() and build_record() to ensure they emit
canonical TTEOP envelopes that validate against the schema.
"""

import json
import math
import os
import subprocess
import sys
import tempfile
import unittest

# Ensure the package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sigrank_standard import build_record, build_envelope, compute_metrics
from sigrank_standard.metrics import build_record as _build_record_direct


class TestBuildEnvelope(unittest.TestCase):
    """Test build_envelope() emits a canonical TTEOP envelope."""

    def setUp(self):
        self.envelope = build_envelope(
            1251211, 11296121, 128196310, 2555179769,
            provider="anthropic",
            model="claude-sonnet-4",
            tool="claude-code",
        )

    def test_has_required_top_level_fields(self):
        required = [
            "protocol_version", "metric_spec_version", "observation",
            "source", "telemetry", "provenance", "privacy", "metrics", "warnings",
        ]
        for field in required:
            self.assertIn(field, self.envelope, f"Missing required field: {field}")

    def test_does_not_emit_obsolete_spec_field(self):
        self.assertNotIn("spec", self.envelope, "Must not emit obsolete 'spec' field")

    def test_does_not_emit_top_level_timestamp(self):
        self.assertNotIn("timestamp", self.envelope, "Must not emit top-level 'timestamp'")

    def test_protocol_version_is_tteop(self):
        self.assertEqual(self.envelope["protocol_version"], "tteop/0.1-draft")

    def test_metric_spec_version(self):
        self.assertEqual(self.envelope["metric_spec_version"], "tteop-metrics/0.1-draft")

    def test_telemetry_pillars(self):
        t = self.envelope["telemetry"]
        self.assertEqual(t["input"], 1251211)
        self.assertEqual(t["output"], 11296121)
        self.assertEqual(t["cache_write"], 128196310)
        self.assertEqual(t["cache_read"], 2555179769)

    def test_source_fields(self):
        s = self.envelope["source"]
        self.assertEqual(s["provider"], "anthropic")
        self.assertEqual(s["model"], "claude-sonnet-4")
        self.assertEqual(s["tool"], "claude-code")

    def test_privacy_mode(self):
        self.assertEqual(self.envelope["privacy"]["mode"], "public-pseudonymous")

    def test_provenance(self):
        self.assertEqual(self.envelope["provenance"]["level"], "self-reported")
        self.assertEqual(self.envelope["provenance"]["signature_status"], "unsigned")

    def test_metrics_present(self):
        m = self.envelope["metrics"]
        for name in ["yield", "leverage", "velocity", "output_fraction", "log_leverage"]:
            self.assertIn(name, m, f"Missing metric: {name}")
        # Frozen MOSES seed invariant
        self.assertAlmostEqual(m["yield"], 18436.98, places=2)

    def test_observation_timestamp_is_isoformat(self):
        ts = self.envelope["observation"]["timestamp"]
        self.assertIsInstance(ts, str)
        # Must be valid ISO 8601 with timezone
        self.assertTrue("T" in ts, "Timestamp must use ISO 8601 T separator")

    def test_legacy_alias_accepted(self):
        """build_envelope should accept the legacy sigrank/0.1-draft version."""
        env = build_envelope(100, 200, 50, 300, spec_version="sigrank/0.1-draft")
        self.assertEqual(env["protocol_version"], "sigrank/0.1-draft")


class TestBuildRecord(unittest.TestCase):
    """Test build_record() — the backward-compatible alias."""

    def test_build_record_is_alias_of_build_envelope(self):
        """build_record and build_envelope must be the same function."""
        self.assertIs(build_record, build_envelope)

    def test_build_record_emits_canonical_envelope(self):
        record = build_record(100, 200, 50, 300)
        self.assertNotIn("spec", record)
        self.assertNotIn("timestamp", record)
        self.assertIn("protocol_version", record)
        self.assertIn("observation", record)
        self.assertIn("telemetry", record)

    def test_build_record_with_optional_fields(self):
        record = build_record(
            100, 200, 50, 300,
            provider="openai",
            model="gpt-4",
            tool="cursor",
            platform="desktop",
            adapter_id="openai-v1",
            adapter_version="2.0.0",
            privacy_mode="enterprise-isolated",
            provenance_level="collector-attested",
            window_start="2026-08-28T08:00:00Z",
            window_end="2026-08-28T12:00:00Z",
            window_duration_seconds=14400,
        )
        self.assertEqual(record["source"]["platform"], "desktop")
        self.assertEqual(record["privacy"]["mode"], "enterprise-isolated")
        self.assertEqual(record["provenance"]["level"], "collector-attested")
        self.assertEqual(record["observation"]["window_start"], "2026-08-28T08:00:00Z")


class TestComputeMetrics(unittest.TestCase):
    """Test compute_metrics() for correct values and null semantics."""

    def test_moses_seed_invariant(self):
        result = compute_metrics(1251211, 11296121, 128196310, 2555179769)
        self.assertAlmostEqual(result["metrics"]["yield"], 18436.98, places=2)
        self.assertAlmostEqual(result["metrics"]["leverage"], 2042.2, places=1)
        self.assertAlmostEqual(result["metrics"]["velocity"], 9.028, places=3)
        self.assertAlmostEqual(result["metrics"]["output_fraction"], 0.9003, places=4)
        self.assertAlmostEqual(result["metrics"]["log_leverage"], 3.31, places=2)

    def test_null_cache_read(self):
        result = compute_metrics(100, 200, 50, None)
        self.assertIsNone(result["metrics"]["yield"])
        self.assertIsNone(result["metrics"]["leverage"])
        self.assertIsNone(result["metrics"]["log_leverage"])
        self.assertIsNotNone(result["metrics"]["velocity"])
        self.assertIsNotNone(result["metrics"]["output_fraction"])

    def test_zero_input(self):
        result = compute_metrics(0, 200, 50, 300)
        self.assertIsNone(result["metrics"]["velocity"])
        self.assertIsNone(result["metrics"]["leverage"])
        self.assertIsNone(result["metrics"]["yield"])

    def test_warnings_present_for_null_cache(self):
        result = compute_metrics(100, 200, None, None)
        self.assertTrue(any("cache_write" in w for w in result["warnings"]))
        self.assertTrue(any("cache_read" in w for w in result["warnings"]))


class TestSchemaValidation(unittest.TestCase):
    """Validate build_envelope output against the canonical TTEOP schema using the JS validator."""

    @classmethod
    def setUpClass(cls):
        """Find the repo root and check if node is available."""
        cls.repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
        cls.validator = os.path.join(cls.repo_root, "conformance", "tteop-validate.mjs")
        cls.has_node = subprocess.run(["which", "node"], stdout=subprocess.PIPE, stderr=subprocess.PIPE).returncode == 0

    def _validate_via_node(self, envelope):
        """Helper: write envelope to temp file, validate with node, return (stdout, returncode)."""
        if not self.has_node:
            self.skipTest("node not available")
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(envelope, f)
            tmp_path = f.name
        try:
            result = subprocess.run(
                ["node", self.validator, tmp_path, "--report", "text"],
                capture_output=True, text=True, cwd=self.repo_root,
            )
            return result.stdout, result.returncode
        finally:
            os.unlink(tmp_path)

    def test_envelope_validates_against_schema(self):
        stdout, rc = self._validate_via_node(build_envelope(
            1251211, 11296121, 128196310, 2555179769,
            provider="anthropic", model="claude-sonnet-4", tool="claude-code",
        ))
        self.assertIn("Overall: PASS", stdout)
        self.assertEqual(rc, 0)

    def test_null_cache_envelope_validates(self):
        """Regression: build_envelope with null cache MUST produce a schema-valid envelope."""
        stdout, rc = self._validate_via_node(build_envelope(100, 200, None, None))
        self.assertIn("Overall: PASS", stdout, f"Null-cache envelope failed validation: {stdout}")
        self.assertEqual(rc, 0)

    def test_null_cache_write_only_validates(self):
        """Regression: null cache_write but non-null cache_read MUST validate."""
        stdout, rc = self._validate_via_node(build_envelope(100, 200, None, 500))
        self.assertIn("Overall: PASS", stdout, f"Null-cache-write envelope failed: {stdout}")
        self.assertEqual(rc, 0)

    def test_null_cache_read_only_validates(self):
        """Regression: non-null cache_write but null cache_read MUST validate."""
        stdout, rc = self._validate_via_node(build_envelope(100, 200, 300, None))
        self.assertIn("Overall: PASS", stdout, f"Null-cache-read envelope failed: {stdout}")
        self.assertEqual(rc, 0)

    def test_null_cache_emits_missingness_flags(self):
        """Regression: null cache values MUST emit validity.missingness_flags."""
        env = build_envelope(100, 200, None, None)
        self.assertIn("validity", env, "Missingness flags require validity object")
        flags = env["validity"]["missingness_flags"]
        self.assertIn("cache_write_not_reported", flags)
        self.assertIn("cache_read_not_reported", flags)

    def test_full_cache_no_missingness_flags(self):
        """Regression: non-null cache values should NOT emit missingness flags."""
        env = build_envelope(100, 200, 300, 500)
        # validity is optional when no missingness — may or may not be present
        if "validity" in env:
            flags = env["validity"].get("missingness_flags", [])
            self.assertNotIn("cache_write_not_reported", flags)
            self.assertNotIn("cache_read_not_reported", flags)


if __name__ == "__main__":
    unittest.main()

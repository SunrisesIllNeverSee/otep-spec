# Conformance Architecture

**Document status:** Normative
**Spec version:** tteop/0.1-draft

---

## 1. Conformance Classes

### 1.1 Producer Conformance

A **producer** is a system that emits TTEOP-conformant telemetry envelopes.

**Mandatory tests:**

| Test ID | Requirement | Description |
|---------|-------------|-------------|
| PROD-001 | SRP-DATA-001 | Emits valid `protocol_version` |
| PROD-002 | SRP-DATA-002 | `telemetry.input` is non-negative integer |
| PROD-003 | SRP-DATA-003 | `telemetry.output` is non-negative integer |
| PROD-004 | SRP-DATA-004 | `telemetry.cache_write` is integer or null |
| PROD-005 | SRP-DATA-005 | `telemetry.cache_read` is integer or null |
| PROD-006 | SRP-DATA-006 | `observation.timestamp` is RFC 3339 |
| PROD-007 | SRP-DATA-007 | `source.tool` is non-empty string |
| PROD-008 | SRP-DATA-008 | `privacy.mode` is one of three modes |
| PROD-009 | SRP-DATA-009 | `provenance.level` is one of four levels |
| PROD-010 | SRP-VAL-001 | Envelope validates against JSON Schema |
| PROD-011 | SRP-VAL-005 | No semantic content in envelope |
| PROD-012 | SRP-VAL-006 | No forbidden field names |
| PROD-013 | SRP-TYPE-008 | No fabrication of missing values |
| PROD-014 | SRP-MISS-001 | Null cache_write has missingness flag |
| PROD-015 | SRP-MISS-002 | Null cache_read has missingness flag |

**Optional tests:**

| Test ID | Description |
|---------|-------------|
| PROD-OPT-001 | Includes `metric_spec_version` |
| PROD-OPT-002 | Includes `observation.window_start`/`window_end` |
| PROD-OPT-003 | Includes `source.adapter_id`/`adapter_version` |
| PROD-OPT-004 | Includes computed `metrics` object |

**Pass/fail rule:** All mandatory tests MUST pass. Optional tests do not affect pass/fail.

**Allowed claims:**
- "TTEOP Producer Conformant — v0.1-draft" (when all mandatory tests pass)

**Prohibited claims:**
- "TTEOP Conformant" (reserved for full-platform conformance with third-party validation)
- "TTEOP Certified" (no certification program exists at v0.1)

---

### 1.2 Consumer Conformance

A **consumer** is a system that ingests TTEOP envelopes and processes them.

**Mandatory tests:**

| Test ID | Requirement | Description |
|---------|-------------|-------------|
| CONS-001 | SRP-VAL-001 | Validates envelopes against JSON Schema |
| CONS-002 | SRP-VAL-002 | Performs semantic validation |
| CONS-003 | SRP-ERR-001 | Returns error codes from taxonomy on rejection |
| CONS-004 | SRP-ERR-002 | Returns warnings on accepted-with-warnings |
| CONS-005 | SRP-VER-002 | Rejects unsupported protocol versions |
| CONS-006 | SRP-VER-005 | Accepts legacy `sigrank/0.1-draft` alias |
| CONS-007 | SRP-COMP-003 | Ignores unknown optional fields gracefully |
| CONS-008 | SRP-DATA-012 | Does not use `raw_provider_fields` for metrics |
| CONS-009 | SRP-AGG-002 | Computes metrics from aggregated sums |
| CONS-010 | SRP-VAL-004 | Does not reject envelopes with anomaly flags |

**Pass/fail rule:** All mandatory tests MUST pass.

**Allowed claims:**
- "TTEOP Consumer Conformant — v0.1-draft"

---

### 1.3 Adapter Conformance

An **adapter** maps provider-native fields to TTEOP primitives.

**Mandatory tests:**

| Test ID | Requirement | Description |
|---------|-------------|-------------|
| ADAPT-001 | SRP-ADAPT-001 | Each native field maps to exactly one primitive |
| ADAPT-002 | SRP-ADAPT-002 | Documents double-counting handling |
| ADAPT-003 | SRP-ADAPT-003 | Double-counting policy implemented correctly |
| ADAPT-004 | SRP-ADAPT-004 | Cache creation unavailable → null + flag |
| ADAPT-005 | SRP-ADAPT-005 | Neither cache field → both null + flags |
| ADAPT-006 | SRP-ADAPT-007 | No non-token fields mapped to primitives |
| ADAPT-007 | SRP-ADAPT-008 | Retries: successful response only |
| ADAPT-008 | SRP-ADAPT-009 | Streaming: aggregates chunks |
| ADAPT-009 | SRP-ADAPT-010 | Batching: sums all tokens |
| ADAPT-010 | SRP-ADAPT-011 | Tool calls: documents inclusion policy |
| ADAPT-011 | SRP-ADAPT-012 | Multi-model: one envelope per model preferred |

**Test-vector coverage:** Each adapter MUST include at least 3 test vectors:
1. A normal case with all fields present
2. A case with missing cache fields
3. A case with double-counting (if applicable to the provider)

**Allowed claims:**
- "TTEOP Adapter Conformant — v0.1-draft (provider: anthropic)"
- "TTEOP Adapter Conformant — v0.1-draft (provider: openai)"

---

### 1.4 Metric-Engine Conformance

A **metric-engine** computes registered metrics from telemetry primitives.

**Mandatory tests:**

| Test ID | Requirement | Description |
|---------|-------------|-------------|
| METR-001 | SRP-METRIC-001 | Correct rounding precision for all 5 metrics |
| METR-002 | SRP-METRIC-002 | Uses banker's rounding (round-half-to-even) |
| METR-003 | SRP-METRIC-003 | Null not zero/infinity/NaN for undefined metrics |
| METR-004 | SRP-METRIC-004 | All 5 metric keys present even when null |
| METR-005 | SRP-METRIC-005 | Warnings for null metrics |
| METR-006 | SRP-METRIC-006 | Warning order: cache-unavailable before metric-undefined |
| METR-007 | SRP-AGG-002 | Computes from aggregated sums, not per-request averages |
| METR-008 | — | Canonical MOSES seed vector: Υ=18436.98, L=2042.2, V=9.028, F=0.9003, D=3.31 |
| METR-009 | — | Zero-input boundary: all input-dependent metrics null |
| METR-010 | — | Zero-output boundary: Yield=0, Velocity=0, log_leverage=null |
| METR-011 | — | Missing-cache boundary: Yield/Leverage/log_leverage null |
| METR-012 | — | Alias translation: cache_creation → cache_write in output |

**Pass/fail rule:** All mandatory tests MUST pass. The canonical MOSES seed vector (METR-008) is a frozen invariant.

**Allowed claims:**
- "TTEOP Metric-Engine Conformant — v0.1-draft"

---

### 1.5 Privacy-Profile Conformance

A **privacy-profile** implementation enforces privacy mode rules.

**Mandatory tests:**

| Test ID | Requirement | Description |
|---------|-------------|-------------|
| PRIV-001 | SRP-PRIV-001 | Enforces privacy mode declaration |
| PRIV-002 | SRP-PRIV-002 | Public mode excludes cohort/tenant identifiers |
| PRIV-003 | SRP-PRIV-003 | Enterprise mode not transmitted externally |
| PRIV-004 | SRP-PRIV-004 | No semantic content required |
| PRIV-005 | SRP-PRIV-005 | Small-cell suppression (n < 5) |
| PRIV-006 | SRP-PRIV-006 | Deletion within 30 days |
| PRIV-007 | SRP-SEC-003 | No sole-basis employment decisions |
| PRIV-008 | SRP-SEC-004 | Enterprise operator rights provided |

**Allowed claims:**
- "TTEOP Privacy-Profile Conformant — v0.1-draft (mode: public-pseudonymous)"
- "TTEOP Privacy-Profile Conformant — v0.1-draft (mode: enterprise-isolated)"

---

### 1.6 Full-Platform Conformance

A **full-platform** implementation passes all mandatory tests from Producer, Consumer, Metric-Engine, and Privacy-Profile classes.

**Mandatory tests:** All mandatory tests from PROD-*, CONS-*, METR-*, and PRIV-* classes.

**Allowed claims:**
- "TTEOP Full-Platform Conformant — v0.1-draft"

**Prohibited claims (until third-party validation):**
- "TTEOP Conformant" (without independent validation)
- "TTEOP Certified" (no certification program exists)
- "TTEOP Standard" (not a formal standard)

---

## 2. CLI Specification

### 2.1 Command structure

```
tteop validate <payload.json> [--profile <privacy-mode>] [--class <conformance-class>] [--report <format>]
```

**Arguments:**
- `<payload.json>` — path to the telemetry envelope JSON file to validate
- `--profile <privacy-mode>` — privacy mode to validate against (`public-pseudonymous`, `private-managed-cohort`, `enterprise-isolated`, `all`). Default: `all`
- `--class <conformance-class>` — conformance class to test against (`producer`, `consumer`, `adapter`, `metric-engine`, `privacy-profile`, `full-platform`). Default: `full-platform`
- `--report <format>` — output format (`json`, `text`, `sarif`). Default: `text`

### 2.2 Example usage

```bash
# Validate a payload against all conformance classes
tteop validate payload.json --report json

# Validate against a specific privacy profile
tteop validate payload.json --profile private-managed --report json

# Validate an adapter specifically
tteop validate payload.json --class adapter --report text
```

### 2.3 Exit codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed |
| 1 | One or more mandatory tests failed |
| 2 | Schema validation error (payload is not valid JSON or does not match schema) |
| 3 | Unsupported protocol version |
| 4 | Internal error |

---

## 3. Example Conformance Report

See `conformance/example-report.json` for a machine-readable example.

---

## 4. Version Compatibility

**`SRP-CONF-003`** Conformance claims MUST identify:
- Protocol version (e.g., `tteop/0.1-draft`)
- Metric spec version (e.g., `tteop-metrics/0.1-draft`)
- Conformance runner version (e.g., `tteop-conformance/0.1.0`)

A conformance claim for `tteop/0.1-draft` is NOT valid for `tteop/0.2-draft` without retesting.

---

## 5. Reporting Format

Conformance reports are JSON documents conforming to `schemas/conformance-report-v0.1.schema.json`.

Key fields:
- `report_version` — always `tteop-conformance/0.1-draft`
- `conformance_class` — which class was tested
- `overall_result` — `pass`, `fail`, or `partial`
- `tests` — array of individual test results
- `allowed_claims` — claims the implementation MAY make
- `prohibited_claims` — claims the implementation MUST NOT make

---

## 6. Complete Requirement-to-Test Mapping

This section maps every normative requirement ID (SRP-*) to at least one
conformance test. Tests are implemented in `conformance/tteop-runner.mjs`.

**Test types:**
- **E** — Executable test (runs in `tteop-runner.mjs`)
- **D** — Documentation test (verified by file existence or content check)
- **S** — Schema test (verified by schema validation)

### 6.1 Architecture (SRP-ARCH)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-ARCH-001 | ARCH-001 | E | Producer envelope validates against schema |
| SRP-ARCH-002 | ARCH-002 | E | Consumer computes metrics identically regardless of producer |
| SRP-ARCH-003 | ARCH-003 | E | Adapter maps fields without altering semantics |
| SRP-ARCH-004 | ARCH-004 | E | Specification is authoritative over proprietary applications |

### 6.2 Data Fields (SRP-DATA)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-DATA-001 | DATA-001a | E | protocol_version present and valid |
| SRP-DATA-002 | DATA-002 | E | telemetry.input is non-negative integer |
| SRP-DATA-003 | DATA-003 | E | telemetry.output is non-negative integer |
| SRP-DATA-004 | DATA-004 | E | telemetry.cache_write is integer or null |
| SRP-DATA-005 | DATA-005 | E | telemetry.cache_read is integer or null |
| SRP-DATA-006 | DATA-006 | E | observation.timestamp is RFC 3339 |
| SRP-DATA-007 | DATA-007 | E | source.tool is non-empty string |
| SRP-DATA-008 | DATA-008 | E | privacy.mode is one of three modes |
| SRP-DATA-009 | DATA-009 | E | provenance.level is one of four levels |
| SRP-DATA-010 | DATA-010 | S | Optional fields have valid types when present |
| SRP-DATA-011 | DATA-011 | E | No real-world identity in pseudonymous_key |
| SRP-DATA-012 | DATA-012 | E | Metrics computed from telemetry, not raw_provider_fields |

### 6.3 Data Types (SRP-TYPE)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-TYPE-001 | TYPE-001a/b | E | Token counts are integers |
| SRP-TYPE-002 | TYPE-002a/b | E | Token counts within safe integer range |
| SRP-TYPE-003 | TYPE-003 | D | Overflow detection documented in SPEC |
| SRP-TYPE-004 | TYPE-004 | E | Zero is valid for input/output |
| SRP-TYPE-005 | TYPE-005 | E | Zero is valid for cache fields when non-null |
| SRP-TYPE-006 | TYPE-006a/b | E | Null means unsupported/unavailable |
| SRP-TYPE-007 | TYPE-007 | E | Null not allowed for input/output |
| SRP-TYPE-008 | TYPE-008 | E | No fabrication of missing values |

### 6.4 Provider Adapters (SRP-ADAPT)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-ADAPT-001 | ADAPT-001 | E | At least 3 adapters registered |
| SRP-ADAPT-002 | ADAPT-002-* | E | Each adapter documents double-counting policy |
| SRP-ADAPT-003 | ADAPT-003 | E | OpenAI adapter subtracts cached_tokens from prompt_tokens |
| SRP-ADAPT-004 | ADAPT-004a/b | E | Cache creation unavailable → null + flag |
| SRP-ADAPT-005 | ADAPT-005a/b | E | Neither cache field → both null + flags |
| SRP-ADAPT-006 | ADAPT-006 | E | Custom adapters registered in registry |
| SRP-ADAPT-007 | ADAPT-007 | D | No non-token fields mapped (verified in adapter docs) |
| SRP-ADAPT-008 | ADAPT-008-doc | D | Retry policy documented in adapter files |
| SRP-ADAPT-009 | ADAPT-009-doc | D | Streaming policy documented in adapter files |
| SRP-ADAPT-010 | ADAPT-010-doc | D | Batching policy documented in adapter files |
| SRP-ADAPT-011 | ADAPT-011 | D | Tool call policy documented in adapter files |
| SRP-ADAPT-012 | ADAPT-012 | D | Multi-model policy documented in adapter files |

### 6.5 Observation Windows (SRP-WIN)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-WIN-001 | WIN-001 | E | Window has start and end (when present) |
| SRP-WIN-002 | WIN-002 | E | window_end ≥ window_start |
| SRP-WIN-003 | WIN-003 | E | Duration matches computed |
| SRP-WIN-004 | WIN-004 | E | Counts are cumulative sums |
| SRP-WIN-005 | WIN-005 | E | Per-request or per-window allowed |
| SRP-WIN-006 | WIN-006 | D | Comparative claims disclose granularity (SPEC §11.3) |

### 6.6 Aggregation (SRP-AGG)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-AGG-001 | AGG-001 | E | Primitives summed correctly |
| SRP-AGG-002 | AGG-002 | E | Metrics from aggregated sums, not per-request averages |
| SRP-AGG-003 | AGG-003 | E | Mixed null/non-null: sum non-null values |
| SRP-AGG-004 | AGG-004 | E | Cross-window metrics recomputed |

### 6.7 Missingness (SRP-MISS)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-MISS-001 | MISS-001 | E | Null cache_write has missingness flag |
| SRP-MISS-002 | MISS-002 | E | Null cache_read has missingness flag |
| SRP-MISS-003 | MISS-003 | E | Null fields not fabricated to 0 |

### 6.8 Validation (SRP-VAL)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-VAL-001 | VAL-001 | E | Valid envelope passes schema validation |
| SRP-VAL-002 | VAL-002 | E | Invalid envelope rejected by semantic validation |
| SRP-VAL-003 | VAL-003 | D | Anomaly detection recommended (SPEC §14.3) |
| SRP-VAL-004 | VAL-004 | E | Anomaly flags don't reject valid envelope |
| SRP-VAL-005 | VAL-005 | E | Prompt field detected as forbidden |
| SRP-VAL-006 | VAL-006 | E | Forbidden field names trigger semantic errors |

### 6.9 Provenance (SRP-PROV)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-PROV-001 | PROV-001 | E | provenance.level present |
| SRP-PROV-002 | PROV-002 | E | Signed envelope has extensions with signature |
| SRP-PROV-003 | PROV-003 | E | Self-reported provenance accepted |
| SRP-PROV-004 | PROV-004 | D | Comparative claims disclose provenance (SPEC §15) |

### 6.10 Signature (SRP-SIG)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-SIG-001 | SIG-001 | E | Signed envelope has signature object with all fields |
| SRP-SIG-002 | SIG-002 | E | Non-signed envelope declares unsigned |
| SRP-SIG-003 | SIG-003 | E | Signed envelope has signature_status 'valid' |

### 6.11 Privacy (SRP-PRIV)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-PRIV-001 | PRIV-001 | E | privacy.mode present |
| SRP-PRIV-002 | PRIV-002 | E | Public mode excludes cohort |
| SRP-PRIV-003 | PRIV-003 | E | Enterprise mode declared |
| SRP-PRIV-004 | PRIV-004 | E | Metrics computable without content |
| SRP-PRIV-005 | PRIV-005 | D | Small-cell suppression (SPEC §17.1) |
| SRP-PRIV-006 | PRIV-006 | D | Deletion within 30 days (SPEC §17.1) |
| SRP-PRIV-007 | PRIV-007 | E | Core metrics from token counts only |
| SRP-PRIV-008 | PRIV-008 | E | Enrichment distinguishable from core |

### 6.12 Security (SRP-SEC)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-SEC-001 | SEC-001 | D | Security reporting process documented (SPEC §18.2) |
| SRP-SEC-002 | SEC-002 | D | Security report timelines documented (SPEC §18.2) |
| SRP-SEC-003 | SEC-003 | D | No sole-basis employment decisions (SPEC §18.3) |
| SRP-SEC-004 | SEC-004 | D | Enterprise operator rights documented (SPEC §18.3) |

### 6.13 Extensions (SRP-EXT)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-EXT-001 | EXT-001 | E | TEP template exists |
| SRP-EXT-002 | EXT-002a/b | E | Metrics and adapters registries exist |
| SRP-EXT-003 | EXT-003 | E | Extension keys use namespace prefixes |
| SRP-EXT-004 | EXT-004-* | E | Each metric has all required registry fields |
| SRP-EXT-005 | EXT-005-* | E | Each adapter has required registry fields |

### 6.14 Version Negotiation (SRP-VER)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-VER-001 | VER-001 | E | protocol_version declared |
| SRP-VER-002 | VER-002 | E | Unsupported version rejected |
| SRP-VER-003 | VER-003 | E | metric_spec_version declared |
| SRP-VER-004 | VER-004 | D | Consumer verifies metric spec version (SPEC §20.2) |
| SRP-VER-005 | VER-005 | E | Legacy alias accepted |

### 6.15 Backward Compatibility (SRP-COMP)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-COMP-001 | COMP-001 | E | Protocol version follows semver format |
| SRP-COMP-002 | COMP-002 | D | Required fields stable in stable versions (SPEC §21.2) |
| SRP-COMP-003 | COMP-003 | D | Unknown optional fields ignored (SPEC §21.2) |
| SRP-COMP-004 | COMP-004 | D | Fields optional before required (SPEC §21.2) |
| SRP-COMP-005 | COMP-005 | E | Frozen MOSES invariant preserved |
| SRP-COMP-006 | COMP-006 | D | Experimental metrics may change (SPEC §21.3) |

### 6.16 Error Taxonomy (SRP-ERR)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-ERR-001 | ERR-001 | E | Invalid envelope produces error codes |
| SRP-ERR-002 | ERR-002 | E | Valid envelope with null cache produces warnings |

### 6.17 Conformance Classes (SRP-CONF)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-CONF-001 | CONF-001 | E | Conformance classes document exists |
| SRP-CONF-002 | CONF-002 | D | No untested conformance claims (SPEC §23) |
| SRP-CONF-003 | CONF-003 | D | Conformance claims identify versions (SPEC §23) |
| SRP-CONF-004 | CONF-004 | D | Conformant reserved for third-party (SPEC §23) |
| SRP-CONF-005 | CONF-005 | E | Conformance runner is open and runnable |
| SRP-CONF-006 | CONF-006 | D | Certification based on published rules (SPEC §23) |

### 6.18 Registry (SRP-REG)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-REG-001 | REG-001 | E | Registry is machine-readable JSON |
| SRP-REG-002 | REG-002-* | E | Each metric entry has required fields |
| SRP-REG-003 | REG-003 | E | TEP process documented |
| SRP-REG-004 | REG-004-* | E | Each adapter entry has required fields |

### 6.19 Non-Inferences (SRP-NON)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-NON-001 | NON-001-* | E | Each metric has prohibited_interpretation |
| SRP-NON-002 | NON-002 | D | Prohibited interpretations documented (SPEC §25.1) |
| SRP-NON-003 | NON-003 | E | SPEC.md exists with claim level definitions |
| SRP-NON-004 | NON-004 | D | Causal claims need study design (SPEC §25.2) |
| SRP-NON-005 | NON-005 | D | Descriptive claims disclose context (SPEC §25.2) |
| SRP-NON-006 | NON-006 | E | Schema does not include ranking/leaderboard fields |
| SRP-NON-007 | NON-007 | D | Rankings disclose criteria (SPEC §25.3) |

### 6.20 Metrics (SRP-METRIC)

| Requirement | Test ID | Type | Description |
|-------------|---------|------|-------------|
| SRP-METRIC-001 | METRIC-001a-e | E | Correct rounding precision for all 5 metrics |
| SRP-METRIC-002 | METRIC-002a-c | E | Banker's rounding (round-half-to-even) |
| SRP-METRIC-003 | METRIC-003a/b | E | Null not zero/infinity/NaN for undefined metrics |
| SRP-METRIC-004 | METRIC-004 | E | All 5 metric keys present even when null |
| SRP-METRIC-005 | METRIC-005 | E | Warnings present for null metrics |
| SRP-METRIC-006 | METRIC-006 | E | Warning order: cache-unavailable before metric-undefined |

### 6.21 Test Vector Coverage

All test vectors in `test-vectors/` are executed by `tteop-runner.mjs`:

| Vector | Metrics tested | Boundary |
|--------|---------------|----------|
| canonical-moses | All 5 | Frozen MOSES invariant |
| zero-input | All 5 | input=0 → null for input-dependent |
| zero-output | All 5 | output=0 → Yield=0, log_leverage=null |
| missing-cache | All 5 | Both cache null → cache-dependent null |
| large-scale | All 5 | Near 2^53 overflow boundary |

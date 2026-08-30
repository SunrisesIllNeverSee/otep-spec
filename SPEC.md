# OTEP — Operator Token Efficiency Protocol

## Specification v0.1-draft

**Status:** Draft — not a formal standard
**Protocol name:** OTEP (Operator Token Efficiency Protocol)
**Legacy alias:** `sigrank/0.1-draft` (backward-compatible)
**Spec version string:** `otep/0.1-draft`
**Maturity:** Experimental — see §3

---

## Table of Contents

1. [Status and Maturity](#1-status-and-maturity)
2. [Scope](#2-scope)
3. [Conformance Terminology](#3-conformance-terminology)
4. [Normative References](#4-normative-references)
5. [Terminology](#5-terminology)
6. [Protocol Architecture](#6-protocol-architecture)
7. [Canonical Telemetry Envelope](#7-canonical-telemetry-envelope)
8. [Required and Optional Fields](#8-required-and-optional-fields)
9. [Data Types and Constraints](#9-data-types-and-constraints)
10. [Provider-Adapter Semantics](#10-provider-adapter-semantics)
11. [Observation Windows](#11-observation-windows)
12. [Aggregation Rules](#12-aggregation-rules)
13. [Missingness Rules](#13-missingness-rules)
14. [Validation Rules](#14-validation-rules)
15. [Provenance Levels](#15-provenance-levels)
16. [Signature and Integrity Model](#16-signature-and-integrity-model)
17. [Privacy Requirements](#17-privacy-requirements)
18. [Security Considerations](#18-security-considerations)
19. [Extension Mechanism](#19-extension-mechanism)
20. [Version Negotiation](#20-version-negotiation)
21. [Backward-Compatibility Policy](#21-backward-compatibility-policy)
22. [Error Taxonomy](#22-error-taxonomy)
23. [Conformance Classes](#23-conformance-classes)
24. [Registry Considerations](#24-registry-considerations)
25. [Explicit Non-Inferences and Prohibited Interpretations](#25-explicit-non-inferences-and-prohibited-interpretations)
26. [Metric Definitions](#26-metric-definitions)
27. [Change Log](#27-change-log)

---

## 1. Status and Maturity

This document is a **draft** of an open measurement specification. It is not a claim that OTEP has achieved formal industry-standard adoption, ISO/IEC recognition, or universal interoperability.

**Maturity levels used in this specification:**

| Level | Meaning |
|-------|---------|
| `experimental` | Metric or feature is under active development. May change between minor versions. Not recommended for production claims. |
| `provisional` | Metric or feature is stable within a version but may change in the next major version. Suitable for pilot deployments. |
| `stable` | Metric or feature is frozen within the current major version. Breaking changes require a major version increment. |
| `deprecated` | Metric or feature is retained for backward compatibility but SHOULD NOT be used in new implementations. |

**Overall specification maturity:** `experimental`

**Protocol name note:** "OTEP" is the proposed neutral name. The legacy name "SigRank Standard" remains valid as a product alias. The spec version string `sigrank/0.1-draft` is accepted as a backward-compatible alias for `otep/0.1-draft`. See `ARCHITECTURE-DECISION-MEMO.md` §10 and `UNRESOLVED-DECISIONS.md` §1.

---

## 2. Scope

### 2.1 In scope

The v0.1-draft protocol defines:

1. A canonical telemetry envelope for AI-operator token-processing data
2. Four primitive telemetry fields (input, output, cache_write, cache_read)
3. Five registered derived metrics
4. Null, missing, zero, unsupported, and invalid value semantics
5. Observation-window and aggregation semantics
6. Provider-adapter mapping model
7. Three privacy modes
8. Validation rules and error taxonomy
9. Provenance levels and optional integrity model
10. Extension mechanism via OEPs (OTEP Extension Proposals)
11. Version negotiation and backward-compatibility policy
12. Six conformance classes
13. Explicit non-inferences and prohibited interpretations

### 2.2 Out of scope

The v0.1-draft protocol does NOT define:

1. Code quality, task correctness, or productivity metrics
2. Public ranking, leaderboard, or certification systems
3. Anti-gaming or abuse-prevention logic
4. Private cohort composition or eligibility thresholds
5. Cost or pricing models
6. Prompt text, completion text, source code, or diff collection
7. Longitudinal analysis methods (deferred to v0.2+)
8. Organizational extensions (deferred to v0.3+)
9. Formal standardization path (deferred to post-v1.0)
10. Cryptographic signature algorithms (v0.1 defines the envelope; algorithm selection deferred to v0.2)

---

## 3. Conformance Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in **IETF BCP 14** [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals, as shown here.

Each normative requirement in this specification has:
- A stable requirement ID (e.g., `SRP-DATA-001`)
- A permanent section anchor
- At least one conformance test in `conformance/`
- An example or test vector where applicable
- An explicit failure condition

---

## 4. Normative References

| Reference | Document |
|-----------|----------|
| [RFC 2119] | Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997 |
| [RFC 8174] | Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017 |
| [RFC 4180] | Shafranovich, Y., "Common Format and MIME Type for Comma-Separated Values (CSV) Files", October 2005 |
| [JSON Schema] | Wright, A., et al., "JSON Schema: A Media Type for Describing JSON Documents", Draft 2020-12 |
| [RFC 3339] | Klyne, G., et al., "Date and Time on the Internet: Timestamps", July 2002 |
| [RFC 8259] | Bray, T., "The JavaScript Object Notation (JSON) Data Interchange Format", December 2017 |
| [SemVer] | Semantic Versioning 2.0.0, https://semver.org/ |

---

## 5. Terminology

See `TERMINOLOGY.md` for the complete canonical glossary. Key terms used in this specification:

| Term | Definition |
|------|------------|
| **Operator** | A human who directs an AI system to produce output. The measured subject. |
| **AI tool** | Software through which an operator interacts with an AI model (IDE, CLI, chat interface, agent framework). |
| **Provider** | An organization that serves AI model inference (Anthropic, OpenAI, Google, etc.). |
| **Model** | A specific AI model variant (claude-sonnet-4, gpt-4o, gemini-2.0-flash, etc.). |
| **Collector** | Software that gathers token telemetry from an AI tool or provider API. |
| **Consumer** | Software that ingests OTEP-conformant telemetry and computes metrics or analytics. |
| **Telemetry envelope** | The canonical data structure carrying token counts and metadata. |
| **Observation window** | A time-bounded period over which token counts are aggregated. |
| **Primitive** | One of the four canonical token-count fields: input, output, cache_write, cache_read. |
| **Metric** | A derived value computed from primitives using a defined formula. |
| **Privacy mode** | A declared policy governing what fields may be present and how identity is handled. |
| **Adapter** | A mapping from provider-native telemetry fields to OTEP canonical primitives. |
| **Provenance** | The declared origin and trust level of a telemetry record. |
| **Missing** | A field whose value is not available from the source (represented as `null`). |
| **Unsupported** | A field that the source provider/tool does not expose (represented as `null` with a flag). |
| **Invalid** | A field whose value violates a schema or semantic constraint. |

---

## 6. Protocol Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCER LAYER                           │
│  AI Tool / IDE / CLI / Agent Framework                      │
│  Collects raw token telemetry from provider API responses   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   ADAPTER LAYER                              │
│  Provider Adapter (Anthropic / OpenAI / Google / custom)    │
│  Maps provider-native fields → OTEP canonical primitives    │
│  Handles double-counting, missing fields, cache semantics   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  TELEMETRY ENVELOPE                          │
│  Canonical OTEP record: I/O/W/R + metadata + provenance     │
│  Schema: schemas/telemetry-envelope-v0.1.schema.json        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   METRIC ENGINE                              │
│  Computes registered metrics from primitives                │
│  Applies null/missing/zero semantics                        │
│  Produces metric record per metrics/registry.json           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONSUMER LAYER                            │
│  Observability platform / Enterprise analytics / Research   │
│  Aggregates, compares, visualizes, exports                  │
│  Applies privacy mode rules                                 │
└─────────────────────────────────────────────────────────────┘
```

**`SRP-ARCH-001`** A conforming producer MUST emit a telemetry envelope that validates against `schemas/telemetry-envelope-v0.1.schema.json`.

**Failure condition:** The envelope does not validate against the schema.

**`SRP-ARCH-002`** A conforming consumer MUST accept any schema-valid telemetry envelope and compute registered metrics identically regardless of the source producer.

**Failure condition:** The consumer produces different metric values for the same envelope when the producer identity changes.

**`SRP-ARCH-003`** A conforming adapter MUST map provider-native fields to OTEP canonical primitives without altering the semantic meaning of the primitives.

**Failure condition:** The adapter maps a provider field to the wrong OTEP primitive (e.g., mapping cached tokens to `input` instead of `cache_read`).

**`SRP-ARCH-004`** This specification is authoritative. No proprietary application, platform, or implementation is authoritative over the specification. Where a proprietary implementation and this specification disagree, the specification prevails.

**Failure condition:** A proprietary implementation's behavior is treated as authoritative over the specification, or the specification is silently modified to match a proprietary implementation without going through the OEP process.

---

## 7. Canonical Telemetry Envelope

The telemetry envelope is the canonical data structure for carrying token-processing data from a producer to a consumer.

### 7.1 Envelope structure

```json
{
  "protocol_version": "otep/0.1-draft",
  "metric_spec_version": "otep-metrics/0.1-draft",
  "collector_version": "string",
  "operator": {
    "pseudonymous_key": "string",
    "cohort_id": "string or null"
  },
  "observation": {
    "timestamp": "RFC 3339 date-time",
    "window_start": "RFC 3339 date-time",
    "window_end": "RFC 3339 date-time",
    "window_duration_seconds": "integer"
  },
  "source": {
    "tool": "string",
    "platform": "string",
    "provider": "string or null",
    "model": "string or null",
    "adapter_id": "string or null",
    "adapter_version": "string or null"
  },
  "telemetry": {
    "input": "integer ≥ 0",
    "output": "integer ≥ 0",
    "cache_write": "integer ≥ 0 or null",
    "cache_read": "integer ≥ 0 or null"
  },
  "raw_provider_fields": {},
  "validity": {
    "status": "valid | invalid | partial",
    "missingness_flags": [],
    "anomaly_flags": []
  },
  "provenance": {
    "level": "self-reported | collector-attested | platform-verified | signed",
    "signature_status": "unsigned | valid | invalid | not-applicable"
  },
  "privacy": {
    "mode": "public-pseudonymous | private-managed-cohort | enterprise-isolated"
  },
  "extensions": {}
}
```

### 7.2 Required fields

**`SRP-DATA-001`** The envelope MUST include `protocol_version` set to `otep/0.1-draft` or the legacy alias `sigrank/0.1-draft`.

**Failure condition:** `protocol_version` is absent or set to an unrecognized value.

**`SRP-DATA-002`** The envelope MUST include `telemetry.input` as a non-negative integer.

**Failure condition:** `input` is absent, negative, or not an integer.

**`SRP-DATA-003`** The envelope MUST include `telemetry.output` as a non-negative integer.

**Failure condition:** `output` is absent, negative, or not an integer.

**`SRP-DATA-004`** The envelope MUST include `telemetry.cache_write` as either a non-negative integer or `null`. The field name `cache_creation` is accepted as a backward-compatible alias for `cache_write`; adapters and consumers MUST normalize `cache_creation` to `cache_write` in output envelopes.

**Failure condition:** `cache_write` is absent (the field itself must be present, even if `null`), negative, or not an integer when non-null.

**`SRP-DATA-005`** The envelope MUST include `telemetry.cache_read` as either a non-negative integer or `null`.

**Failure condition:** `cache_read` is absent (the field itself must be present, even if `null`), negative, or not an integer when non-null.

**`SRP-DATA-006`** The envelope MUST include `observation.timestamp` as an RFC 3339 date-time string.

**Failure condition:** `timestamp` is absent or not a valid RFC 3339 date-time.

**`SRP-DATA-007`** The envelope MUST include `source.tool` as a non-empty string.

**Failure condition:** `tool` is absent or empty.

**`SRP-DATA-008`** The envelope MUST include `privacy.mode` as one of the three defined privacy modes.

**Failure condition:** `privacy.mode` is absent or not one of `public-pseudonymous`, `private-managed-cohort`, `enterprise-isolated`.

**`SRP-DATA-009`** The envelope MUST include `provenance.level` as one of the four defined provenance levels.

**Failure condition:** `provenance.level` is absent or not one of `self-reported`, `collector-attested`, `platform-verified`, `signed`.

### 7.3 Optional fields

**`SRP-DATA-010`** The envelope MAY include `metric_spec_version`, `collector_version`, `operator`, `observation.window_*`, `source.provider`, `source.model`, `source.adapter_*`, `raw_provider_fields`, `validity`, `provenance.signature_status`, and `extensions`.

**Failure condition:** A producer includes an optional field with an invalid type or value (e.g., `collector_version` as a number instead of a string).

**`SRP-DATA-011`** The envelope MAY include `operator.pseudonymous_key` but MUST NOT include real-world identity (name, email, employee ID) in any privacy mode.

**Failure condition:** A field containing real-world identity is present.

**`SRP-DATA-012`** The envelope MAY include `raw_provider_fields` for debugging and adapter validation, but consumers MUST NOT use raw provider fields for metric computation.

**Failure condition:** A consumer computes metrics from `raw_provider_fields` instead of canonical `telemetry` fields.

---

## 8. Required and Optional Fields

| Field | Required? | Type | Constraint |
|-------|-----------|------|------------|
| `protocol_version` | MUST | string | `otep/0.1-draft` or `sigrank/0.1-draft` |
| `metric_spec_version` | SHOULD | string | `otep-metrics/0.1-draft` |
| `collector_version` | SHOULD | string | non-empty |
| `operator.pseudonymous_key` | SHOULD | string | non-empty, no real identity |
| `operator.cohort_id` | MAY | string or null | |
| `observation.timestamp` | MUST | string | RFC 3339 date-time |
| `observation.window_start` | SHOULD | string | RFC 3339 date-time |
| `observation.window_end` | SHOULD | string | RFC 3339 date-time |
| `observation.window_duration_seconds` | SHOULD | integer | ≥ 0 |
| `source.tool` | MUST | string | non-empty |
| `source.platform` | SHOULD | string | |
| `source.provider` | MAY | string or null | |
| `source.model` | MAY | string or null | |
| `source.adapter_id` | MAY | string or null | |
| `source.adapter_version` | MAY | string or null | |
| `telemetry.input` | MUST | integer | ≥ 0 |
| `telemetry.output` | MUST | integer | ≥ 0 |
| `telemetry.cache_write` | MUST | integer or null | ≥ 0 when non-null |
| `telemetry.cache_read` | MUST | integer or null | ≥ 0 when non-null |
| `raw_provider_fields` | MAY | object | |
| `validity.status` | SHOULD | string | `valid`, `invalid`, `partial` |
| `validity.missingness_flags` | MAY | array of strings | |
| `validity.anomaly_flags` | MAY | array of strings | |
| `provenance.level` | MUST | string | one of four levels |
| `provenance.signature_status` | MAY | string | `unsigned`, `valid`, `invalid`, `not-applicable` |
| `privacy.mode` | MUST | string | one of three modes |
| `extensions` | MAY | object | namespace-prefixed keys |

---

## 9. Data Types and Constraints

### 9.1 Integer fields

**`SRP-TYPE-001`** Token-count fields (`input`, `output`, `cache_write`, `cache_read`) MUST be JSON integers (not floating-point numbers).

**Failure condition:** A token-count field is a JSON number with a fractional component.

**`SRP-TYPE-002`** Token-count fields MUST be in the range `[0, 2^53 - 1]` (safe integer range for JSON/JavaScript interoperability).

**Failure condition:** A token-count field exceeds `9007199254740991`.

**`SRP-TYPE-003`** Implementations SHOULD detect overflow (values exceeding `2^53 - 1`) and set `validity.status` to `partial` with an `overflow` anomaly flag.

**Failure condition: An implementation does not detect overflow (values exceeding 2^53 - 1) when it is technically capable of doing so.**

### 9.2 Zero value

**`SRP-TYPE-004`** Zero is a valid value for `input` and `output`. A zero value means "no tokens were observed in this category for this observation window."

**Failure condition: An implementation rejects a zero value for input or output as invalid.**

**`SRP-TYPE-005`** Zero is a valid value for `cache_write` and `cache_read` when the field is non-null. A zero value means "cache was available but no tokens were written/read."

**Failure condition: An implementation rejects a zero value for a non-null cache field as invalid.**

### 9.3 Null value

**`SRP-TYPE-006`** `null` for `cache_write` or `cache_read` means "the source does not expose this field" or "this field is unsupported by the provider."

**Failure condition:** An implementation interprets `null` as zero or as a missing field (schema violation) instead of as "unsupported/unavailable."

**`SRP-TYPE-007`** `null` MUST NOT be used for `input` or `output`. These fields are always required as non-negative integers.

**Failure condition:** `input` or `output` is `null`.

### 9.4 Distinction between absent, zero, null, unknown, and unsupported

| State | Representation | Meaning |
|-------|----------------|---------|
| **Absent** | Field not in JSON | Schema violation for required fields; allowed for optional fields |
| **Zero** | `0` | Observed value of zero; the category was measured and the count was zero |
| **Null** | `null` | Source does not expose this field; unsupported or unavailable |
| **Unknown** | `null` + `missingness_flags` entry | Source may expose the field but did not for this observation |
| **Unsupported** | `null` + `validity.missingness_flags` includes `cache_write_unsupported` or `cache_read_unsupported` | Provider/tool does not support this telemetry category |

**`SRP-TYPE-008`** An implementation MUST NOT fabricate a value for a field that is null/missing/unsupported.

**Failure condition:** An implementation replaces `null` with `0` or any other value without an explicit, documented normalization rule.

---

## 10. Provider-Adapter Semantics

### 10.1 Adapter model

Providers expose token telemetry in different formats. An **adapter** maps provider-native fields to OTEP canonical primitives. Adapters are defined in `adapters/` and registered in `adapters/registry.json`.

**`SRP-ADAPT-001`** An adapter MUST map each provider-native token-count field to exactly one OTEP primitive (`input`, `output`, `cache_write`, `cache_read`) or declare it unmapped.

**Failure condition:** A provider-native field is mapped to multiple OTEP primitives, or an OTEP primitive receives contributions from incompatible provider fields.

**`SRP-ADAPT-002`** An adapter MUST document how it handles providers that report cached tokens inside total input.

**Failure condition:** An adapter does not document its double-counting policy.

### 10.2 Double-counting policy

Some providers (e.g., OpenAI) report `cached_tokens` inside `prompt_tokens` (total input). This creates a double-counting risk: if `cache_read` is set to `cached_tokens` and `input` is set to `prompt_tokens`, then `input` already includes the cached tokens.

**`SRP-ADAPT-003`** When a provider reports cached tokens inside total input, the adapter MUST either:

(a) Set `input` to `total_input - cached_tokens` (subtract cached from input to get fresh input), OR

(b) Set `input` to `total_input` and document that `input` includes cached tokens (with a `validity.anomaly_flags` entry of `input_includes_cached`).

**Failure condition:** The adapter silently includes cached tokens in `input` without documentation or anomaly flag.

**Recommendation:** Option (a) is preferred because it makes `input` represent fresh (uncached) tokens, which is the semantic intent of the OTEP `input` primitive.

### 10.3 Providers that expose cache reads but not cache creation

**`SRP-ADAPT-004`** When a provider exposes cache reads but not cache creation, the adapter MUST set `cache_write` to `null` and include `cache_write_unsupported` in `validity.missingness_flags`.

**Failure condition:** The adapter fabricates a `cache_write` value.

### 10.4 Providers that expose neither cache field

**`SRP-ADAPT-005`** When a provider exposes neither cache field, the adapter MUST set both `cache_write` and `cache_read` to `null` and include both `cache_write_unsupported` and `cache_read_unsupported` in `validity.missingness_flags`.

**Failure condition: The adapter sets a non-null value for a cache field the provider does not expose, or omits the required missingness flags.**

### 10.5 Initial adapters

The v0.1-draft includes adapter definitions for:

| Provider | Adapter file | Cache creation | Cache read | Double-counting |
|----------|-------------|----------------|------------|-----------------|
| Anthropic | `adapters/anthropic.md` | `cache_creation_input_tokens` → `cache_write` | `cache_read_input_tokens` → `cache_read` | No (separate fields) |
| OpenAI | `adapters/openai.md` | Not exposed → `null` | `prompt_tokens_details.cached_tokens` → `cache_read` | Yes (subtract from input) |
| Google | `adapters/google.md` | Not exposed → `null` | `cached_content_token_count` → `cache_read` | Provider-dependent |

### 10.6 Custom adapters

**`SRP-ADAPT-006`** An implementation MAY define custom adapters for providers not in the initial set. Custom adapters MUST follow the same mapping rules and MUST be registered in `adapters/registry.json` with a unique `adapter_id`.

**Failure condition:** A custom adapter is not registered in `adapters/registry.json`, or its `adapter_id` is not unique.

**`SRP-ADAPT-007`** Custom adapters MUST NOT map non-token-count fields (e.g., cost, latency, character counts) to OTEP primitives.

**Failure condition:** A custom adapter maps a cost or latency field to a token-count primitive.

### 10.7 Retries, streaming, batching, tool calls, and multi-model workflows

**`SRP-ADAPT-008`** Retries: If a request is retried, the adapter MUST count tokens from the successful response only, not from failed attempts. If the failed attempt's tokens are included, the adapter MUST document this and set `validity.anomaly_flags` to include `retry_tokens_included`.

**Failure condition: The adapter includes tokens from failed retry attempts without documentation or anomaly flag.**

**`SRP-ADAPT-009`** Streaming: For streaming responses, the adapter MUST aggregate all chunks into a single `output` count for the observation window. Per-chunk counts are not valid OTEP telemetry.

**Failure condition: The adapter emits per-chunk output counts instead of aggregating all chunks into a single output value.**

**`SRP-ADAPT-010`** Batching: If multiple requests are batched into a single API call, the adapter MUST sum all token counts into the envelope's primitives. The adapter MAY include a `batch_count` extension field.

**Failure condition: The adapter does not sum all batched request tokens into the envelope primitives.**

**`SRP-ADAPT-011`** Tool calls: If an agent makes tool calls that generate sub-requests, the adapter MUST document whether sub-request tokens are included in the envelope. The default policy is to include all tokens attributed to the operator's session, including sub-requests.

**Failure condition: The adapter includes or excludes tool-call sub-request tokens without documenting the policy.**

**`SRP-ADAPT-012`** Multi-model workflows: If a single operator session uses multiple models, the adapter MUST either (a) emit one envelope per model or (b) emit one envelope with `source.model` set to `multi` and document the aggregation. Option (a) is preferred.

**Failure condition: The adapter combines multiple models into a single envelope without setting source.model to "multi" or documenting the aggregation.**

---

## 11. Observation Windows

### 11.1 Definition

An **observation window** is a time-bounded period over which token counts are aggregated. Every telemetry envelope represents exactly one observation window.

**`SRP-WIN-001`** An observation window MUST have a `window_start` and `window_end`, both as RFC 3339 date-time strings.

**Failure condition:** `window_start` or `window_end` is absent or invalid.

**`SRP-WIN-002`** `window_end` MUST be greater than or equal to `window_start`.

**Failure condition:** `window_end` precedes `window_start`.

**`SRP-WIN-003`** `window_duration_seconds` MUST equal the difference between `window_end` and `window_start` in seconds, rounded to the nearest integer.

**Failure condition:** `window_duration_seconds` does not match the computed duration.

### 11.2 Per-request vs. per-window

**`SRP-WIN-004`** Token counts in the telemetry envelope represent cumulative sums within the observation window, not per-request averages.

**Failure condition:** An implementation reports per-request averages instead of cumulative sums.

**`SRP-WIN-005`** An implementation MAY emit per-request envelopes (where the window covers a single request) or per-session/per-task/per-window envelopes (where the window covers multiple requests). The window definition makes the scope explicit.

**Failure condition: An implementation emits envelopes with ambiguous window scope (neither per-request nor per-window is documented).**

### 11.3 Window granularity

The protocol does not mandate a specific window granularity. Common granularities include:

| Granularity | Typical duration | Use case |
|-------------|-----------------|----------|
| Per-request | seconds | Real-time observability |
| Per-task | minutes to hours | Task-level efficiency |
| Per-session | hours | Session-level analysis |
| Per-day | 24 hours | Daily aggregation |
| Per-week | 7 days | Weekly benchmarking |

**`SRP-WIN-006`** Comparative claims using OTEP metrics MUST disclose the observation window granularity.

**Failure condition:** A comparative claim does not disclose the window granularity.

---

## 12. Aggregation Rules

### 12.1 Summing across requests

**`SRP-AGG-001`** When aggregating multiple per-request envelopes into a per-window envelope, each primitive (`input`, `output`, `cache_write`, `cache_read`) MUST be the sum of the corresponding values across all requests in the window.

**Failure condition:** Aggregation uses averaging, min, max, or any operation other than sum for primitives.

### 12.2 Metric computation after aggregation

**`SRP-AGG-002`** Metrics MUST be computed from the aggregated primitive sums, NOT averaged from per-request metric values.

**Rationale:** `Υ = (R × O) / I²` is not linear: `mean(Υ_i) ≠ Υ(sum(I), sum(O), sum(R))`. Computing metrics from aggregated sums is the only way to produce consistent results.

**Failure condition:** An implementation averages per-request metric values to produce a window-level metric.

### 12.3 Handling nulls in aggregation

**`SRP-AGG-003`** When aggregating requests where some have `null` cache fields and others have non-null values:
- If ALL requests in the window have `null` for a cache field, the aggregated value is `null`.
- If ANY request in the window has a non-null value for a cache field, the aggregated value is the sum of non-null values. The `validity.missingness_flags` MUST include `partial_cache_missing`.

**Failure condition:** Aggregation treats mixed null/non-null values inconsistently.

### 12.4 Cross-window aggregation

**`SRP-AGG-004`** Cross-window aggregation (e.g., combining daily windows into a weekly window) follows the same summing rules as within-window aggregation. Metrics MUST be recomputed from the new aggregated sums.

**Failure condition: Cross-window aggregation does not recompute metrics from the new aggregated sums.**

---

## 13. Missingness Rules

### 13.1 Missingness flags

The `validity.missingness_flags` array documents which fields are missing and why:

| Flag | Meaning |
|------|---------|
| `cache_write_unsupported` | Provider does not expose cache creation telemetry |
| `cache_read_unsupported` | Provider does not expose cache read telemetry |
| `cache_write_not_reported` | Provider may expose this field but did not for this observation |
| `cache_read_not_reported` | Provider may expose this field but did not for this observation |
| `provider_field_mapping_uncertain` | Adapter mapping is uncertain for this provider |
| `partial_cache_missing` | Some requests in the window had cache data, others did not |

**`SRP-MISS-001`** When `cache_write` is `null`, the envelope MUST include at least one `cache_write_*` flag in `validity.missingness_flags`.

**Failure condition:** `cache_write` is `null` but no missingness flag is present.

**`SRP-MISS-002`** When `cache_read` is `null`, the envelope MUST include at least one `cache_read_*` flag in `validity.missingness_flags`.

**Failure condition:** `cache_read` is `null` but no missingness flag is present.

### 13.2 Prohibition on fabrication

**`SRP-MISS-003`** An implementation MUST NOT replace a null/missing value with zero, a computed estimate, or any other fabricated value.

**Failure condition:** A null cache field is replaced with a non-null value without an explicit, documented normalization rule from an accepted OEP.

### 13.3 Metric behavior with missing fields

When a required input to a metric is null (missing), the metric value MUST be `null`. See §26 for per-metric missing-field behavior.

---

## 14. Validation Rules

### 14.1 Schema validation

**`SRP-VAL-001`** A telemetry envelope MUST validate against `schemas/telemetry-envelope-v0.1.schema.json`.

**Failure condition:** Schema validation produces errors.

### 14.2 Semantic validation

**`SRP-VAL-002`** After schema validation, a consumer MUST perform semantic validation:
1. `input` and `output` are non-negative integers (not null)
2. `cache_write` and `cache_read` are non-negative integers or null
3. `window_end ≥ window_start` (when both are present)
4. `privacy.mode` is one of the three defined modes
5. `provenance.level` is one of the four defined levels
6. No real-world identity fields are present

**Failure condition:** Any semantic validation check fails (null input/output, invalid privacy mode, invalid provenance level, real-world identity present).

### 14.3 Anomaly detection

**`SRP-VAL-003`** A consumer SHOULD flag the following anomalies:
- `input` = 0 with `output` > 0 (impossible without cached input)
- `cache_read` > `input` × 100 (suspiciously high leverage)
- `output` > `input` × 1000 (suspiciously high velocity)
- Any primitive > 2^53 - 1 (overflow)

**Failure condition: A consumer does not flag the listed anomalies when they are detectable from the envelope data.**

**`SRP-VAL-004`** Anomalies MUST NOT cause rejection of a valid envelope. They MUST be recorded in `validity.anomaly_flags` and MAY affect downstream eligibility decisions (e.g., leaderboard inclusion).

**Failure condition: A consumer rejects a valid envelope solely because anomaly flags are present.**

### 14.5 Content independence validation

**`SRP-VAL-005`** A telemetry envelope MUST NOT contain prompt text, completion text, source code, diffs, keystrokes, screen contents, unrestricted file paths, or sensitive repository content.

**Failure condition:** Any of these content types is present in the envelope.

**`SRP-VAL-006`** The following field names are forbidden in all envelope locations: `prompt`, `prompt_text`, `completion`, `completion_text`, `response_text`, `source_code`, `code`, `diff`, `keystrokes`, `screen_content`, `file_path`, `file_content`, `repo_content`.

**Failure condition:** Any forbidden field name appears in the envelope.

---

## 15. Provenance Levels

Provenance levels declare the trust level of a telemetry record:

| Level | Meaning | Requirements |
|-------|---------|--------------|
| `self-reported` | Operator self-reports their telemetry | No verification. Lowest trust. |
| `collector-attested` | A collector tool attests to the telemetry | Collector identity and version declared. Medium trust. |
| `platform-verified` | A platform (e.g., SignalAF) verifies the telemetry against its own records | Platform identity declared. Higher trust. |
| `signed` | Telemetry is cryptographically signed | Signature algorithm and key fingerprint declared. Highest trust. |

**`SRP-PROV-001`** Every envelope MUST declare a provenance level.

**Failure condition:** `provenance.level` is absent.

**`SRP-PROV-002`** A producer MUST NOT claim a higher provenance level than it can support.

**Failure condition:** A self-reported envelope claims `platform-verified` or `signed` level without evidence.

**`SRP-PROV-003`** Consumers MAY treat envelopes with lower provenance levels with reduced confidence but MUST NOT reject them solely on provenance level.

**Failure condition: A consumer rejects an envelope solely because its provenance level is lower than the consumer prefers.**

**`SRP-PROV-004`** Comparative claims using OTEP metrics SHOULD disclose the provenance level of the compared records.

**Failure condition: A comparative claim does not disclose the provenance level of the compared records.**

---

## 16. Signature and Integrity Model

### 16.1 v0.1 scope

The v0.1-draft defines the envelope for signatures but does not mandate a specific algorithm. Signature algorithm selection is deferred to v0.2.

**`SRP-SIG-001`** When `provenance.level` is `signed`, the envelope MUST include a `signature` object in `extensions` with:
- `algorithm`: string identifying the signature algorithm
- `key_fingerprint`: string identifying the signing key
- `value`: base64-encoded signature value
- `signed_fields`: array of field paths covered by the signature

**Failure condition: A signed envelope lacks the signature object in extensions, or the signature object is missing algorithm, key_fingerprint, value, or signed_fields.**

**Failure condition:** A `signed` envelope lacks the `signature` extension object.

**`SRP-SIG-002`** When `provenance.level` is not `signed`, `provenance.signature_status` MUST be `unsigned` or `not-applicable`.

**Failure condition: A non-signed envelope declares a signature_status other than "unsigned" or "not-applicable".**

**`SRP-SIG-003`** A consumer verifying a signature MUST set `provenance.signature_status` to `valid` or `invalid` based on the verification result.

**Failure condition: A consumer verifying a signature does not set signature_status to "valid" or "invalid" based on the verification result.**

### 16.2 v0.2 plan

v0.2 will define:
- Mandatory algorithm: Ed25519 (recommended) or HMAC-SHA256 (for symmetric key scenarios)
- Canonical serialization for signing (JCS — JSON Canonical Form)
- Key distribution model
- Signature revocation process

---

## 17. Privacy Requirements

### 17.1 Privacy modes

See `PRIVACY.md` for full definitions. Summary:

| Mode | Identity | Retention | Public ranking | Small-cell suppression |
|------|----------|-----------|----------------|----------------------|
| `public-pseudonymous` | Pseudonymous key only | Per platform policy | Eligible | Required (n < 5 suppressed) |
| `private-managed-cohort` | Pseudonymous key + cohort ID | Per cohort policy | Not eligible | Required (n < 5 suppressed) |
| `enterprise-isolated` | Pseudonymous key + tenant ID | Per enterprise policy | Not eligible | Required (n < 5 suppressed) |

**`SRP-PRIV-001`** Every envelope MUST declare a privacy mode.

**Failure condition:** `privacy.mode` is absent.

**`SRP-PRIV-002`** An envelope in `public-pseudonymous` mode MUST NOT include `operator.cohort_id` or any tenant identifier.

**Failure condition:** A `public-pseudonymous` envelope contains cohort or tenant identifiers.

**`SRP-PRIV-003`** An envelope in `enterprise-isolated` mode MUST NOT be transmitted to any external consumer without explicit enterprise consent.

**Failure condition:** An enterprise-isolated envelope is transmitted to an external consumer without documented enterprise consent.

**`SRP-PRIV-004`** All privacy modes MUST NOT require collection of prompt text, completion text, source code, diffs, keystrokes, screen contents, or sensitive repository content.

**Failure condition:** Any implementation requires semantic content to compute core metrics.

**`SRP-PRIV-005`** Small-cell suppression: When publishing aggregate statistics, any group with fewer than 5 members MUST be suppressed (not displayed).

**Failure condition:** Published statistics reveal a group with fewer than 5 members.

**`SRP-PRIV-006`** Deletion: An operator MUST be able to request deletion of their telemetry from any consumer. The consumer MUST delete within 30 days and confirm deletion.

**Failure condition:** A consumer refuses or fails to process a deletion request.

### 17.2 Content independence

**`SRP-PRIV-007`** The core OTEP metrics MUST be computable from token counts alone, without any semantic content.

**Failure condition:** An implementation cannot compute metrics without prompt or completion text.

**`SRP-PRIV-008`** Optional enrichment (model, provider, tool, timestamps, workflow stage, task result, PR data, cost, incidents, business KPIs) MAY be combined with OTEP metrics but MUST be distinguishable from the core metric layer.

**Failure condition: Optional enrichment data is not distinguishable from the core metric layer (e.g., enrichment fields appear in the telemetry object).**

---

## 18. Security Considerations

### 18.1 Threat model

| Threat | Description | Mitigation |
|--------|-------------|------------|
| Telemetry fabrication | An operator fabricates token counts to inflate metrics | Provenance levels, anomaly detection, signed envelopes |
| Identity leakage | Real-world identity is exposed in pseudonymous records | Privacy mode rules, small-cell suppression |
| Content leakage | Prompt/completion text leaks into telemetry | Content independence rules, forbidden field validation |
| Replay attacks | A valid signed envelope is replayed with modified timestamps | Nonce/timestamp validation, signature covers timestamp |
| Man-in-the-middle | Telemetry is modified in transit | Signed envelopes, TLS transport |
| Metadata inference | Token counts alone reveal sensitive information about operator behavior | Documented as a known limitation; no mitigation in v0.1 |

### 18.2 Reporting process

**`SRP-SEC-001`** Security vulnerabilities in the specification or reference implementation MUST be reported to `security@signalaf.com` (temporary; a neutral security contact will be established post-v0.5).

**Failure condition: A security vulnerability is reported through an undocumented channel, or no reporting channel is provided.**

**`SRP-SEC-002`** Security reports MUST be acknowledged within 48 hours and addressed within 90 days.

**Failure condition: A security report is not acknowledged within 48 hours or not addressed within 90 days.**

### 18.3 Employee-surveillance misuse

**`SRP-SEC-003`** The specification explicitly prohibits using OTEP metrics as the sole basis for employment decisions (hiring, firing, promotion, compensation).

**Failure condition: OTEP metrics are used as the sole basis for an employment decision (hiring, firing, promotion, compensation).**

**`SRP-SEC-004`** Enterprise deployments MUST provide operators with:
- Access to their own telemetry
- The ability to opt out of enterprise collection (with documented consequences)
- Transparency about what is collected and how it is used

**Failure condition:** An enterprise deployment does not provide these operator rights.

---

## 19. Extension Mechanism

### 19.1 OEP process

Extensions to the protocol are proposed through **OEPs** (OTEP Extension Proposals). See `GOVERNANCE.md` for the full OEP lifecycle.

**`SRP-EXT-001`** Any addition, modification, or deprecation of a normative requirement MUST go through the OEP process.

**Failure condition:** A normative requirement is changed without an accepted OEP.

**`SRP-EXT-002`** Extensions (new metrics, new adapters, new privacy modes) MUST be registered in the appropriate registry before claiming conformance.

**Failure condition:** An extension claims conformance without being registered in the appropriate registry.

**`SRP-EXT-003`** Extension namespaces: Custom extensions in the `extensions` object MUST use a namespace prefix (e.g., `extensions["com.example.myext"]`) to avoid collisions.

**Failure condition:** An extension uses unqualified field names in the `extensions` object.

### 19.2 Metric registry

Metrics are versioned separately from the base protocol. See `metrics/registry.json` for the machine-readable registry.

**`SRP-EXT-004`** A new metric MUST be registered with: metric ID, name, maturity, formula, input requirements, valid domain, zero behavior, missingness behavior, aggregation behavior, interpretation, prohibited interpretation, and test vectors.

**Failure condition: A new metric is registered without one or more of the required fields.**

### 19.3 Adapter registry

Adapters are registered in `adapters/registry.json`.

**`SRP-EXT-005`** A new adapter MUST be registered with: adapter ID, provider name, supported versions, field mappings, double-counting policy, and test vectors.

**Failure condition: A new adapter is registered without one or more of the required fields.**

---

## 20. Version Negotiation

### 20.1 Version string format

Protocol versions use the format `otep/<major>.<minor>-<status>`:
- `otep/0.1-draft` — v0.1 draft
- `otep/0.5-draft` — v0.5 draft
- `otep/1.0` — v1.0 stable

**`SRP-VER-001`** Every envelope MUST declare its protocol version in `protocol_version`.

**Failure condition: An envelope does not declare its protocol version in protocol_version.**

**`SRP-VER-002`** A consumer MUST reject envelopes with protocol versions it does not support, returning an error of type `unsupported_version` (see §22).

**Failure condition: A consumer accepts an envelope with a protocol version it does not support, or rejects it without returning an unsupported_version error.**

### 20.2 Metric spec versioning

Metric definitions are versioned separately: `otep-metrics/0.1-draft`.

**`SRP-VER-003`** Every envelope SHOULD declare its metric spec version in `metric_spec_version`.

**Failure condition: An envelope does not declare its metric spec version (when the producer supports metric spec versioning).**

**`SRP-VER-004`** A consumer MUST verify that the metric spec version matches its supported version before computing metrics.

**Failure condition: A consumer computes metrics without verifying the metric spec version matches its supported version.**

### 20.3 Legacy alias

**`SRP-VER-005`** The version string `sigrank/0.1-draft` MUST be accepted as a backward-compatible alias for `otep/0.1-draft`. Consumers MUST NOT reject envelopes solely because they use the legacy version string.

**Failure condition: A consumer rejects an envelope solely because it uses the legacy version string sigrank/0.1-draft.**

---

## 21. Backward-Compatibility Policy

### 21.1 Semantic versioning

**`SRP-COMP-001`** The protocol follows semantic versioning:
- **Major version** increment: breaking changes to normative requirements
- **Minor version** increment: backward-compatible additions (new optional fields, new metrics, new adapters)
- **Draft status** (`-draft`): experimental; any change is permitted within the same major version

**Failure condition: A version increment does not follow the semantic versioning rules (e.g., a breaking change in a minor version).**

### 21.2 Field stability

**`SRP-COMP-002`** Required fields in a stable version (no `-draft` suffix) MUST NOT be removed or change semantic meaning in a subsequent version of the same major version.

**Failure condition: A required field is removed or its semantic meaning changes within the same major version (stable release).**

**`SRP-COMP-003`** Optional fields MAY be added in minor versions. Consumers MUST ignore unknown optional fields gracefully.

**Failure condition: A consumer rejects an envelope solely because it contains an unknown optional field.**

**`SRP-COMP-004`** New required fields MAY be added in minor versions only if they were optional in the previous version. A field MUST be optional for at least one version before becoming required.

**Failure condition: A field becomes required without having been optional in a previous version.**

### 21.3 Metric stability

**`SRP-COMP-005`** A metric marked `stable` MUST NOT have its formula changed within the same major version.

**Failure condition: A stable metric formula is changed within the same major version.**

**`SRP-COMP-006`** A metric marked `experimental` or `provisional` MAY change between minor versions. Consumers MUST check the metric spec version.

**Failure condition: An experimental or provisional metric changes formula without a metric spec version increment.**

---

## 22. Error Taxonomy

| Error code | Meaning | HTTP equivalent | Action |
|------------|---------|-----------------|--------|
| `schema_violation` | Envelope does not validate against JSON Schema | 400 | Reject envelope |
| `unsupported_version` | Protocol version not supported by consumer | 426 | Reject envelope |
| `invalid_type` | Field has wrong type (e.g., string where integer expected) | 422 | Reject envelope |
| `invalid_value` | Field has valid type but invalid value (e.g., negative token count) | 422 | Reject envelope |
| `missing_required_field` | A required field is absent | 422 | Reject envelope |
| `forbidden_field` | A forbidden field is present (e.g., prompt text) | 422 | Reject envelope |
| `identity_leak` | Real-world identity detected in envelope | 422 | Reject envelope |
| `provenance_mismatch` | Claimed provenance level not supported by evidence | 403 | Downgrade provenance or reject |
| `signature_invalid` | Signature verification failed | 401 | Reject or downgrade provenance |
| `anomaly_detected` | Anomaly flags present but envelope is valid | 200 | Accept with warning |
| `partial_data` | Some fields are null/missing | 200 | Accept with warning |
| `overflow` | Token count exceeds safe integer range | 422 | Reject or truncate with warning |

**`SRP-ERR-001`** A consumer rejecting an envelope MUST return an error code from this taxonomy.

**Failure condition: A consumer rejects an envelope without returning an error code from the taxonomy.**

**`SRP-ERR-002`** A consumer accepting an envelope with warnings MUST include the warning codes in the response.

**Failure condition: A consumer accepts an envelope with warnings but does not include warning codes in the response.**

---

## 23. Conformance Classes

See `conformance/classes.md` for full definitions. Summary:

| Class | Description | Mandatory tests |
|-------|-------------|-----------------|
| **Producer** | Emits valid telemetry envelopes | Schema, primitives, null semantics, privacy, content independence |
| **Consumer** | Ingests and processes envelopes | Schema validation, metric computation, aggregation, error handling |
| **Adapter** | Maps provider-native fields to OTEP primitives | Field mapping, double-counting, missing fields, anomaly flags |
| **Metric-engine** | Computes registered metrics | All 5 metrics, null semantics, boundary cases, rounding |
| **Privacy-profile** | Enforces privacy mode rules | Field restrictions, identity handling, small-cell suppression, deletion |
| **Full-platform** | Producer + Consumer + Metric-engine + Privacy-profile | All mandatory tests from all classes |

**`SRP-CONF-001`** A system claiming conformance to a class MUST pass all mandatory tests for that class.

**Failure condition: A system claims conformance to a class without passing all mandatory tests for that class.**

**`SRP-CONF-002`** A system MUST NOT claim conformance to a class it has not been tested against.

**Failure condition: A system claims conformance to a class it has not been tested against.**

**`SRP-CONF-003`** Conformance claims MUST identify the protocol version, metric spec version, and conformance runner version used for testing.

**Failure condition: A conformance claim does not identify the protocol version, metric spec version, or conformance runner version.**

**`SRP-CONF-004`** `SigRank Conformant` / `OTEP Conformant` is reserved until a third-party implementation passes the conformance suite independently.

**Failure condition: A system claims "OTEP Conformant" without third-party independent validation.**

**`SRP-CONF-005`** Payment MUST NOT be a prerequisite for conformance testing. Conformance tests are open and freely runnable.

**Failure condition: Conformance tests are not freely runnable or require payment before testing.**

**`SRP-CONF-006`** Certification marks (if established) MUST be based on published, appealable rules. Payment for certification services MAY cover operational costs but MUST NOT purchase technical conformity.

**Failure condition: A certification mark is based on unpublished, non-appealable, or pay-to-play rules.**

---

## 24. Registry Considerations

### 24.1 Metric registry

The metric registry is maintained in `metrics/registry.json` within this repository. It is not an IANA-style external registry at v0.1.

**`SRP-REG-001`** The registry MUST be machine-readable JSON.

**Failure condition: The metric registry is not machine-readable JSON.**
**`SRP-REG-002`** Each metric entry MUST include all fields specified in §19.2.

**Failure condition: A metric entry in the registry is missing one or more required fields.**
**`SRP-REG-003`** Registry changes MUST go through the OEP process.

**Failure condition: A registry change is made without going through the OEP process.**

### 24.2 Adapter registry

The adapter registry is maintained in `adapters/registry.json`.

**`SRP-REG-004`** Each adapter entry MUST include: adapter ID, provider name, supported API versions, field mappings, and a reference to the adapter definition file.

**Failure condition: An adapter entry in the registry is missing one or more required fields.**

### 24.3 Future IANA-style registry

Post-v1.0, the metric and adapter registries MAY be transferred to an IANA-style external registry if:
1. The protocol has 2+ independent implementations
2. A neutral governance body is established
3. The community agrees on registry management rules

This is a future consideration, not a v0.1 requirement.

---

## 25. Explicit Non-Inferences and Prohibited Interpretations

### 25.1 What OTEP metrics do NOT measure

**`SRP-NON-001`** OTEP metrics MUST NOT be presented as proof of:
- Code quality
- Task correctness
- Task success
- Productivity
- Professional skill
- Employee performance
- Business impact
- Causal improvement from an AI tool
- Human intelligence
- Creativity

**Failure condition: An OTEP metric is presented as proof of code quality, productivity, task success, professional skill, employee performance, business impact, or causal improvement.**

**`SRP-NON-002`** Any claim that OTEP metrics prove any of the above is a **prohibited interpretation** and a conformance violation.

**Failure condition: A claim states that OTEP metrics prove any of the prohibited interpretations listed in SRP-NON-001.**

### 25.2 Claim levels

**`SRP-NON-003`** Claims using OTEP metrics MUST be classified as one of:

**Failure condition: A claim using OTEP metrics is not classified as descriptive, comparative, associational, or causal.**

| Level | Definition | Example |
|-------|------------|---------|
| **Descriptive** | States what was measured | "Operator A had Υ = 18436.98 in the July window" |
| **Comparative** | Compares two or more measured values | "Operator A's Υ was higher than Operator B's in the July window" |
| **Associational** | States a statistical association with an external variable | "Higher Υ is associated with higher PR merge rate (r = 0.3, p < 0.05)" |
| **Causal** | States that a metric causes an outcome | "Higher Υ causes higher PR merge rate" |

**`SRP-NON-004`** Causal claims MUST be supported by appropriate study design (randomized experiment or quasi-experimental method with confounders addressed). Associational claims MUST NOT be presented as causal.

**Failure condition: A causal claim is made without appropriate study design, or an associational claim is presented as causal.**

**`SRP-NON-005`** Descriptive and comparative claims MUST disclose the observation window, aggregation method, and provenance level.

**Failure condition: A descriptive or comparative claim does not disclose the observation window, aggregation method, or provenance level.**

### 25.3 Public rankings

**`SRP-NON-006`** Public rankings and credentials are NOT normative requirements of the base protocol. They are application-layer features that MAY be built on top of the protocol.

**Failure condition: A public ranking is presented as a normative requirement of the base protocol.**

**`SRP-NON-007`** A public ranking MUST disclose: the field definition, eligibility criteria, observation window, and provenance level of ranked records.

**Failure condition: A public ranking does not disclose field definition, eligibility criteria, observation window, or provenance level.**

---

## 26. Metric Definitions

All metrics are defined in detail in `metrics/` and registered in `metrics/registry.json`. Summary:

### 26.1 Yield (Υ)

- **Formula:** `Υ = (cache_read × output) / input²`
- **Equivalent:** `Υ = Leverage × Velocity`
- **Maturity:** `experimental`
- **Undefined when:** `input = 0` or `cache_read` is null
- **What it measures:** A composite signal combining cache reuse (Leverage) and output generation (Velocity)
- **What it does NOT measure:** Code quality, productivity, or task success
- **Known limitation:** Quadratically sensitive to input scale due to `input²` in denominator. See `metrics/yield.md` for full analysis.
- **Normalization profiles:** Proposed alternatives (window-normalized Υ_w, linear-input Υ_lin, sqrt-input Υ_sqrt, log-yield log_Υ) documented in `metrics/normalization-profiles.md`. All experimental, deferred to v0.2 via OEP.
- **Test vector:** MOSES canonical seed → Υ = 18436.98

### 26.2 Leverage

- **Formula:** `L = cache_read / input`
- **Maturity:** `experimental`
- **Undefined when:** `input = 0` or `cache_read` is null
- **What it measures:** How much cached context an operator reuses relative to fresh input
- **What it does NOT measure:** Output quality or task efficiency
- **Test vector:** MOSES canonical seed → L = 2042.2

### 26.3 Velocity

- **Formula:** `V = output / input`
- **Maturity:** `experimental`
- **Undefined when:** `input = 0`
- **What it measures:** How much output an operator generates relative to fresh input
- **What it does NOT measure:** Output quality or usefulness
- **Test vector:** MOSES canonical seed → V = 9.028

### 26.4 output_fraction (formerly SNR)

- **Formula:** `F = output / (input + output)`
- **Maturity:** `experimental`
- **Undefined when:** `input + output = 0`
- **What it measures:** What fraction of total token flow is output
- **What it does NOT measure:** Signal-to-noise ratio in any signal-processing sense
- **Note:** Renamed from "SNR" because the formula is not a signal-to-noise ratio. The legacy alias `snr` is accepted for backward compatibility.
- **Test vector:** MOSES canonical seed → F = 0.9003

### 26.5 log_leverage (formerly 10xDEV)

- **Formula:** `D = log10(cache_read / input) = log10(Leverage)`
- **Maturity:** `experimental`
- **Undefined when:** `input = 0`, `cache_read` is null, or any of `input`, `output`, `cache_write`, `cache_read` is zero (per reference implementation policy)
- **What it measures:** Logarithmic scale of cache reuse leverage
- **What it does NOT measure:** Developer productivity or "10x" classification
- **Note:** Renamed from "10xDEV" to avoid implying developer productivity. The "10xDEV" label is retained as an application-profile alias in `profiles/application/dev10x.md`. The legacy alias `dev10x` is accepted for backward compatibility.
- **Test vector:** MOSES canonical seed → D = 3.31

### 26.6 Rounding

**`SRP-METRIC-001`** Metric values MUST be rounded as follows:
- `yield`: 2 decimal places
- `leverage`: 1 decimal place
- `velocity`: 3 decimal places
- `output_fraction`: 4 decimal places
- `log_leverage`: 2 decimal places

**Failure condition: A metric value is rounded to a different precision than specified.**

**`SRP-METRIC-002`** Rounding MUST use round-half-to-even (banker's rounding) to avoid systematic bias.

**Failure condition:** An implementation uses round-half-up or truncation.

### 26.7 Null metric values

**`SRP-METRIC-003`** When a metric is undefined (due to zero denominator or missing input), the metric value MUST be `null`, not `0`, `Infinity`, or `NaN`.

**Failure condition:** An undefined metric is represented as `0`, `Infinity`, `NaN`, or any non-null value instead of `null`.

**`SRP-METRIC-004`** The metric object MUST include all five metric keys, even when some are `null`. An implementation MUST NOT omit a metric key.

**Failure condition:** A metric key is absent from the metrics object.

### 26.8 Warnings

**`SRP-METRIC-005`** When a metric is null, the envelope SHOULD include a machine-readable warning string explaining why.

**Failure condition: A metric is null but no warning string is included in the envelope.**

Standard warning strings:
- `yield_undefined: requires input>0 and cache_read available`
- `leverage_undefined: requires input>0 and cache_read available`
- `velocity_undefined: input=0`
- `output_fraction_undefined: input+output=0`
- `log_leverage_undefined: requires all four pillars > 0`
- `cache_write is unavailable; log_leverage is undefined.`
- `cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.`

**`SRP-METRIC-006`** Warnings MUST be an ordered array. Cache-unavailable warnings MUST appear before metric-specific undefined warnings.

**Failure condition: Warnings are not an ordered array, or cache-unavailable warnings appear after metric-specific undefined warnings.**

---

## 27. Change Log

| Version | Date | Changes |
|---------|------|---------|
| `otep/0.1-draft` | 2026-08-28 | Initial public draft. Upgrades `sigrank/0.1-draft` with stable requirement IDs, provider adapters, observation windows, privacy modes, provenance levels, conformance classes, and explicit non-inferences. |
| `sigrank/0.1-draft` | 2026-08-27 | Initial draft extracted from sigrank-app. Primitives, 5 metrics, null semantics, schema, conformance runner. |

---

## Appendix A: Requirement ID Index

| ID | Section | Description |
|----|---------|-------------|
| SRP-ARCH-001 | §6 | Producer emits schema-valid envelope |
| SRP-ARCH-002 | §6 | Consumer computes metrics identically regardless of producer |
| SRP-ARCH-003 | §6 | Adapter maps fields without altering semantics |
| SRP-ARCH-004 | §6 | Specification is authoritative over proprietary applications |
| SRP-DATA-001 | §7.2 | protocol_version present and valid |
| SRP-DATA-002 | §7.2 | telemetry.input required non-negative integer |
| SRP-DATA-003 | §7.2 | telemetry.output required non-negative integer |
| SRP-DATA-004 | §7.2 | telemetry.cache_write required (integer or null) |
| SRP-DATA-005 | §7.2 | telemetry.cache_read required (integer or null) |
| SRP-DATA-006 | §7.2 | observation.timestamp required RFC 3339 |
| SRP-DATA-007 | §7.2 | source.tool required non-empty string |
| SRP-DATA-008 | §7.2 | privacy.mode required one of three |
| SRP-DATA-009 | §7.2 | provenance.level required one of four |
| SRP-DATA-010 | §7.3 | Optional fields documented |
| SRP-DATA-011 | §7.3 | No real-world identity in any mode |
| SRP-DATA-012 | §7.3 | Raw provider fields not used for metrics |
| SRP-TYPE-001 | §9.1 | Token counts are integers |
| SRP-TYPE-002 | §9.1 | Token counts within safe integer range |
| SRP-TYPE-003 | §9.1 | Overflow detection |
| SRP-TYPE-004 | §9.2 | Zero is valid for input/output |
| SRP-TYPE-005 | §9.2 | Zero is valid for cache fields when non-null |
| SRP-TYPE-006 | §9.3 | Null means unsupported/unavailable |
| SRP-TYPE-007 | §9.3 | Null not allowed for input/output |
| SRP-TYPE-008 | §9.4 | No fabrication of missing values |
| SRP-ADAPT-001 | §10.1 | Adapter maps each field to one primitive |
| SRP-ADAPT-002 | §10.1 | Adapter documents double-counting handling |
| SRP-ADAPT-003 | §10.2 | Double-counting policy: subtract or flag |
| SRP-ADAPT-004 | §10.3 | Cache creation unavailable → null + flag |
| SRP-ADAPT-005 | §10.4 | Neither cache field → both null + flags |
| SRP-ADAPT-006 | §10.6 | Custom adapters registered |
| SRP-ADAPT-007 | §10.6 | No non-token fields mapped to primitives |
| SRP-ADAPT-008 | §10.7 | Retries: successful response only |
| SRP-ADAPT-009 | §10.7 | Streaming: aggregate chunks |
| SRP-ADAPT-010 | §10.7 | Batching: sum all tokens |
| SRP-ADAPT-011 | §10.7 | Tool calls: document inclusion policy |
| SRP-ADAPT-012 | §10.7 | Multi-model: one envelope per model preferred |
| SRP-WIN-001 | §11.1 | Window has start and end |
| SRP-WIN-002 | §11.1 | Window end ≥ start |
| SRP-WIN-003 | §11.1 | Duration matches computed |
| SRP-WIN-004 | §11.2 | Counts are cumulative sums |
| SRP-WIN-005 | §11.2 | Per-request or per-window allowed |
| SRP-WIN-006 | §11.3 | Comparative claims disclose granularity |
| SRP-AGG-001 | §12.1 | Aggregation uses sum for primitives |
| SRP-AGG-002 | §12.2 | Metrics computed from aggregated sums |
| SRP-AGG-003 | §12.3 | Null handling in aggregation |
| SRP-AGG-004 | §12.4 | Cross-window aggregation rules |
| SRP-MISS-001 | §13.1 | Null cache_write → missingness flag |
| SRP-MISS-002 | §13.1 | Null cache_read → missingness flag |
| SRP-MISS-003 | §13.2 | No fabrication of missing values |
| SRP-VAL-001 | §14.1 | Schema validation required |
| SRP-VAL-002 | §14.2 | Semantic validation required |
| SRP-VAL-003 | §14.3 | Anomaly detection recommended |
| SRP-VAL-004 | §14.3 | Anomalies don't reject valid envelopes |
| SRP-VAL-005 | §14.5 | No semantic content in envelope |
| SRP-VAL-006 | §14.5 | Forbidden field names |
| SRP-PROV-001 | §15 | Provenance level required |
| SRP-PROV-002 | §15 | No false provenance claims |
| SRP-PROV-003 | §15 | Lower provenance not rejected |
| SRP-PROV-004 | §15 | Comparative claims disclose provenance |
| SRP-SIG-001 | §16.1 | Signed envelopes include signature object |
| SRP-SIG-002 | §16.1 | Non-signed envelopes declare unsigned |
| SRP-SIG-003 | §16.1 | Signature verification sets status |
| SRP-PRIV-001 | §17.1 | Privacy mode required |
| SRP-PRIV-002 | §17.1 | Public mode excludes cohort/tenant |
| SRP-PRIV-003 | §17.1 | Enterprise mode not transmitted externally |
| SRP-PRIV-004 | §17.1 | No semantic content required |
| SRP-PRIV-005 | §17.1 | Small-cell suppression |
| SRP-PRIV-006 | §17.1 | Deletion within 30 days |
| SRP-PRIV-007 | §17.2 | Core metrics computable without content |
| SRP-PRIV-008 | §17.2 | Enrichment distinguishable from core |
| SRP-SEC-001 | §18.2 | Security reporting process |
| SRP-SEC-002 | §18.2 | Security report timelines |
| SRP-SEC-003 | §18.3 | No sole-basis employment decisions |
| SRP-SEC-004 | §18.3 | Enterprise operator rights |
| SRP-EXT-001 | §19.1 | Normative changes via OEP |
| SRP-EXT-002 | §19.1 | Extensions registered |
| SRP-EXT-003 | §19.1 | Extension namespace prefixes |
| SRP-EXT-004 | §19.2 | Metric registry fields |
| SRP-EXT-005 | §19.3 | Adapter registry fields |
| SRP-VER-001 | §20.1 | Protocol version declared |
| SRP-VER-002 | §20.1 | Unsupported version rejected |
| SRP-VER-003 | §20.2 | Metric spec version declared |
| SRP-VER-004 | §20.2 | Metric spec version verified |
| SRP-VER-005 | §20.3 | Legacy alias accepted |
| SRP-COMP-001 | §21.1 | Semantic versioning |
| SRP-COMP-002 | §21.2 | Required fields stable in stable versions |
| SRP-COMP-003 | §21.2 | Unknown optional fields ignored |
| SRP-COMP-004 | §21.2 | Fields optional before required |
| SRP-COMP-005 | §21.3 | Stable metrics formula frozen |
| SRP-COMP-006 | §21.3 | Experimental metrics may change |
| SRP-ERR-001 | §22 | Error codes from taxonomy |
| SRP-ERR-002 | §22 | Warnings in response |
| SRP-CONF-001 | §23 | Pass mandatory tests for claimed class |
| SRP-CONF-002 | §23 | No untested conformance claims |
| SRP-CONF-003 | §23 | Conformance claims identify versions |
| SRP-CONF-004 | §23 | Conformant reserved for third-party |
| SRP-CONF-005 | §23 | No pay-to-play for conformance |
| SRP-CONF-006 | §23 | Certification based on published rules |
| SRP-REG-001 | §24.1 | Registry is machine-readable |
| SRP-REG-002 | §24.1 | Registry entries complete |
| SRP-REG-003 | §24.1 | Registry changes via OEP |
| SRP-REG-004 | §24.2 | Adapter registry fields |
| SRP-NON-001 | §25.1 | No proof of quality/productivity/etc. |
| SRP-NON-002 | §25.1 | Prohibited interpretations |
| SRP-NON-003 | §25.2 | Claim level classification |
| SRP-NON-004 | §25.2 | Causal claims need study design |
| SRP-NON-005 | §25.2 | Descriptive claims disclose context |
| SRP-NON-006 | §25.3 | Rankings not normative |
| SRP-NON-007 | §25.3 | Rankings disclose criteria |
| SRP-METRIC-001 | §26.6 | Rounding precision |
| SRP-METRIC-002 | §26.6 | Banker's rounding |
| SRP-METRIC-003 | §26.7 | Null not zero/infinity/NaN |
| SRP-METRIC-004 | §26.7 | All metric keys present |
| SRP-METRIC-005 | §26.8 | Warnings for null metrics |
| SRP-METRIC-006 | §26.8 | Warning order |

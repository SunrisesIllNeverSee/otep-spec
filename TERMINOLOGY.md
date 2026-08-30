# Terminology

**Document status:** Normative
**Spec version:** otep/0.1-draft

This document is the canonical glossary for the OTEP specification. Terms
defined here are binding on all implementations. Where a term is used in
`SPEC.md`, it has the meaning defined here.

---

## A

### Adapter
Software that maps provider-native token-telemetry fields to OTEP canonical
primitives (`input`, `output`, `cache_write`, `cache_read`). Adapters handle
double-counting, missing fields, and provider-specific cache semantics. See
SPEC.md §10 and `adapters/`.

### Aggregation
The process of combining multiple per-request telemetry observations into a
single per-window observation by summing each primitive. See SPEC.md §12.

### AI tool
Software through which an operator interacts with an AI model. Examples:
IDE-based assistants (Cursor, Copilot, Windsurf), CLI agents (Claude Code),
chat interfaces, and agent frameworks. The tool is the producer of telemetry.

### Anomaly flag
A string in `validity.anomaly_flags` indicating a suspicious or noteworthy
pattern in the telemetry (e.g., `input_includes_cached`, `overflow`).
Anomalies do not invalidate an envelope; they inform downstream eligibility
decisions. See SPEC.md §14.3.

---

## C

### Cache read (`cache_read`, R)
The number of tokens served from a provider's prompt cache during the
observation window. A non-negative integer, or `null` when the provider does
not expose cache-read telemetry. See SPEC.md §9.

### Cache write (`cache_write`, W)
The number of tokens written to a provider's prompt cache during the
observation window. A non-negative integer, or `null` when the provider does
not expose cache-write telemetry. See SPEC.md §9.

### Collector
Software that gathers token telemetry from an AI tool or provider API and
emits OTEP-conformant envelopes. A collector is a kind of producer.

### Conformance class
A named category of OTEP conformance (producer, consumer, adapter,
metric-engine, privacy-profile, full-platform) with a defined set of
mandatory and optional tests. See SPEC.md §23 and `conformance/classes.md`.

### Consumer
Software that ingests OTEP-conformant telemetry envelopes and processes them
(computing metrics, aggregating, visualizing, exporting). See SPEC.md §6.

---

## E

### Envelope (telemetry envelope)
The canonical data structure carrying token counts and metadata from a
producer to a consumer. Defined by
`schemas/telemetry-envelope-v0.1.schema.json`. See SPEC.md §7.

### Extension
A namespace-prefixed addition to the `extensions` object of an envelope that
is not part of the core protocol. Extensions MUST use a reverse-DNS prefix.
See SPEC.md §19.

---

## I

### Input (`input`, I)
The number of fresh (uncached) input tokens processed during the observation
window. A non-negative integer. MUST NOT be `null`. See SPEC.md §9.

### Invalid
A field or envelope whose value violates a schema or semantic constraint.
Invalid envelopes fail validation. See SPEC.md §14.

---

## M

### Metric
A derived value computed from primitives using a defined formula. Metrics are
versioned separately from the base protocol in `metrics/registry.json`. See
SPEC.md §26.

### Missingness flag
A string in `validity.missingness_flags` documenting which fields are missing
and why (e.g., `cache_write_unsupported`, `cache_read_not_reported`). See
SPEC.md §13.

### Model
A specific AI model variant (e.g., `claude-sonnet-4`, `gpt-4o`,
`gemini-2.0-flash`). Declared in `source.model`.

---

## N

### Null
The JSON value `null`, used for `cache_write` and `cache_read` when the source
does not expose the field. Null MUST NOT be used for `input` or `output`. See
SPEC.md §9.3.

---

## O

### Observation window
A time-bounded period over which token counts are aggregated. Every envelope
represents exactly one observation window, defined by `window_start` and
`window_end`. See SPEC.md §11.

### OEP (OTEP Extension Proposal)
A formal proposal to add, modify, or deprecate a normative requirement. OEPs
follow the lifecycle defined in `GOVERNANCE.md`. See SPEC.md §19.

### Operator
A human who directs an AI system to produce output. The measured subject. The
protocol measures operators, not models. See SPEC.md §5.

### Output (`output`, O)
The number of output (completion) tokens generated during the observation
window. A non-negative integer. MUST NOT be `null`. See SPEC.md §9.

### output_fraction
A registered metric: `F = output / (input + output)`. The fraction of total
token flow that is output. Formerly named "SNR"; renamed because the formula
is not a signal-to-noise ratio. See `metrics/registry.json` and SPEC.md §26.4.

---

## P

### Primitive
One of the four canonical token-count fields: `input`, `output`,
`cache_write`, `cache_read`. See SPEC.md §7.

### Privacy mode
A declared policy governing what fields an envelope may contain and how
identity is handled. Three modes: `public-pseudonymous`,
`private-managed-cohort`, `enterprise-isolated`. See SPEC.md §17 and
`PRIVACY.md`.

### Producer
Software that emits OTEP-conformant telemetry envelopes. A collector is a
producer. See SPEC.md §6.

### Provenance
The declared origin and trust level of a telemetry record. Four levels:
`self-reported`, `collector-attested`, `platform-verified`, `signed`. See
SPEC.md §15.

### Provider
An organization that serves AI model inference (Anthropic, OpenAI, Google,
etc.). Declared in `source.provider`.

---

## S

### Small-cell suppression
A privacy requirement: when publishing aggregate statistics, any group with
fewer than 5 members MUST be suppressed. See SPEC.md §17 and `PRIVACY.md`.

### Spec version string
The protocol version identifier in `protocol_version` (e.g.,
`otep/0.1-draft`). The legacy alias `sigrank/0.1-draft` is accepted. See
SPEC.md §20.

---

## U

### Unsupported
A field that the source provider/tool does not expose. Represented as `null`
with a `*_unsupported` missingness flag. Distinct from "absent" (field not in
JSON) and "zero" (observed value of 0). See SPEC.md §9.4.

---

## V

### Validity status
The `validity.status` field: `valid`, `invalid`, or `partial`. `partial`
indicates the envelope is schema-valid but some fields are missing or
anomalous. See SPEC.md §14.

---

## W

### Warning
A machine-readable string in the `warnings` array explaining why a metric is
null. Warnings MUST be ordered: cache-unavailability warnings precede
metric-undefined warnings (SRP-METRIC-006). See SPEC.md §26.8.

---

## Cross-references

| Term | Defined in | Used in |
|------|-----------|---------|
| Operator | §TERMINOLOGY | SPEC §5, §25 |
| Primitive | §TERMINOLOGY | SPEC §7, §9 |
| Adapter | §TERMINOLOGY | SPEC §10 |
| Observation window | §TERMINOLOGY | SPEC §11 |
| Privacy mode | §TERMINOLOGY | SPEC §17, PRIVACY.md |
| Provenance | §TERMINOLOGY | SPEC §15 |
| Conformance class | §TERMINOLOGY | SPEC §23, conformance/classes.md |
| output_fraction | §TERMINOLOGY | SPEC §26.4, metrics/registry.json |
| log_leverage | §TERMINOLOGY | SPEC §26.5, metrics/registry.json |

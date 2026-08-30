# Changelog

All notable changes to the TTEOP specification are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — 2026-08-28

### Added — TTEOP v0.1-draft public specification package

This release upgrades the `sigrank/0.1-draft` minimal specification to a complete, implementable public specification package under the proposed neutral name "TTEOP" (Token Telemetry Evaluation Operator Protocol).

#### Core specification
- `SPEC.md` — complete normative protocol specification with 100+ stable requirement IDs (`SRP-*`)
- `TERMINOLOGY.md` — canonical terminology with all defined terms
- `ARCHITECTURE-DECISION-MEMO.md` — executive assessment, critical corrections, design rationale
- `REPOSITORY-ARCHITECTURE.md` — complete repository tree with authority of every path

#### Schemas
- `schemas/telemetry-envelope-v0.1.schema.json` — canonical telemetry envelope schema
- `schemas/conformance-report-v0.1.schema.json` — conformance report output schema

#### Metrics
- `metrics/registry.json` — machine-readable metric registry with 5 metrics
- Each metric includes: formula, valid domain, zero behavior, missingness behavior, aggregation behavior, interpretation, prohibited interpretation, known limitations, gaming considerations, rounding rules, and test vectors

#### Metric changes (from sigrank/0.1-draft)
- `SNR` renamed to `output_fraction` in normative core (legacy alias `snr` retained)
- `10xDEV` renamed to `log_leverage` in normative core (legacy alias `dev10x` retained; "10xDEV" retained as application profile alias in `profiles/application/dev10x.md`)
- All 5 metric values preserved: Υ=18436.98, L=2042.2, V=9.028, F=0.9003, D=3.31 (MOSES canonical seed)

#### Provider adapters
- `adapters/provider-mapping-model.md` — adapter architecture
- `adapters/anthropic.md` — Anthropic provider adapter
- `adapters/openai.md` — OpenAI provider adapter (with double-counting policy)
- `adapters/google.md` — Google provider adapter
- `adapters/registry.json` — machine-readable adapter registry

#### Privacy
- `profiles/public-pseudonymous.md` — public pseudonymous privacy mode
- `profiles/private-managed-cohort.md` — private managed cohort privacy mode
- `profiles/enterprise-isolated.md` — enterprise isolated privacy mode
- `SECURITY.md` — security considerations and threat model
- `PRIVACY.md` updated to reference new privacy mode definitions

#### Conformance
- `conformance/classes.md` — 6 conformance classes (producer, consumer, adapter, metric-engine, privacy-profile, full-platform)
- `conformance/example-report.json` — example machine-readable conformance report
- CLI specification: `tteop validate payload.json --profile <mode> --class <class> --report <format>`

#### Examples and test vectors
- `examples/minimal-valid.json` — minimal valid telemetry envelope
- `examples/complete-valid.json` — complete valid telemetry envelope
- `examples/unsupported-cache.json` — payload with unsupported cache fields
- `examples/invalid-payload.json` — invalid payload for negative testing
- `examples/signed-envelope.json` — signed envelope example
- `examples/expected-validation-results.json` — expected validation results
- `test-vectors/canonical-moses.json` — MOSES canonical seed vector
- `test-vectors/zero-input.json` — I=0 boundary case
- `test-vectors/zero-output.json` — O=0 boundary case
- `test-vectors/missing-cache.json` — cache unavailable boundary case
- `test-vectors/large-scale.json` — overflow/scale boundary case

#### Governance
- `GOVERNANCE.md` — complete governance document (343 lines, 56 requirement IDs)
- `teps/TEP-0000.md` — TEP process and template
- `teps/TEP-0001.md` — protocol name and versioning proposal
- `CONTRIBUTING.md` — contribution guide (DCO model)
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1
- `TRADEMARKS.md` — trademark usage guidelines

#### Implementation and adoption
- `IMPLEMENTATION-EXPERIENCE.md` — implementation registry and independence criteria
- `OPEN-COMMERCIAL-BOUNDARY.md` — open/closed boundary matrix
- `ADOPTION-ROADMAP.md` — v0.1 → v1.0 roadmap
- `INTEGRATION-ADOPTION-PLAN.md` — 8 integration classes
- `BUSINESS-MODEL.md` — sustainable commercial model
- `RISK-REGISTER.md` — 15 risks with controls
- `BACKLOG-30-60-90.md` — 30/60/90-day implementation backlog
- `UNRESOLVED-DECISIONS.md` — decisions requiring founder approval
- `LICENSING-DECISION-MATRIX.md` — licensing analysis

### Changed
- Protocol name proposed change: "SigRank Standard" → "TTEOP" (Token Telemetry Evaluation Operator Protocol)
- Spec version string: `sigrank/0.1-draft` → `tteop/0.1-draft` (legacy alias retained)
- `docs/SPEC.md` superseded by root-level `SPEC.md` (305 → 600+ lines)
- `docs/GOVERNANCE.md` superseded by root-level `GOVERNANCE.md` (31 → 343 lines)

### Frozen invariants preserved
- MOSES seed values: (1_251_211, 11_296_121, 128_196_310, 2_555_179_769) → Υ 18436.98
- Upsilon formula: (cache_read × output) / input²
- 10xDEV formula: log₁₀(Leverage) = log₁₀(R/I) = 3.31
- All canonical metric values unchanged

---

## [sigrank/0.1-draft] — 2026-08-27

### Added — Initial draft
- Four telemetry primitives: input, output, cache_write, cache_read
- Five derived metrics: Yield, Leverage, Velocity, SNR, 10xDEV
- Null/missing semantics
- JSON Schema for portable interchange records
- Executable conformance runner (JS + Python) with 13 fixtures
- Reference math package (@sigrank/cascade)
- Privacy and content-independence requirements
- Boundary documentation separating open core from commercial extensions

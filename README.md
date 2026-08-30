# OTEP — Operator Token Efficiency Protocol

**An open, vendor-neutral interoperability standard for measuring AI-operator token efficiency.**

OTEP defines a minimal common language that any AI tool, IDE, observability platform, enterprise analytics system, or independent implementation can produce and consume consistently. It measures how efficiently an operator processes tokens — not cognition, work quality, employee productivity, or business outcomes.

## Current version

**`otep/0.1-draft`** — experimental public draft. The name "OTEP" is provisional pending founder ratification (UD-1) and trademark clearance (UD-9). See `oeps/OEP-0001.md` and `DISCLOSURES.md`.

The legacy alias `sigrank/0.1-draft` is accepted for backward compatibility.

## Portable core

Four non-negative integer telemetry primitives:

| Primitive | Symbol | Description |
|-----------|--------|-------------|
| Input | `I` | Fresh input-token quantity |
| Output | `O` | Output-token quantity |
| Cache Write | `W` | Token quantity written to a cache (alias: `cache_creation`) |
| Cache Read | `R` | Token quantity read from a cache |

Five derived metrics:

| Metric | Formula | Null when |
|--------|---------|-----------|
| Yield (Υ) | `(R × O) / I²` | `I = 0` or `R` unavailable |
| Leverage | `R / I` | `I = 0` or `R` unavailable |
| Velocity | `O / I` | `I = 0` |
| output_fraction | `O / (I + O)` | `I + O = 0` |
| log_leverage | `log10(R / I)` | Any pillar `= 0` or unavailable |

**Yield is experimental** — it is quadratically sensitive to input scale. Four normalization profiles are defined in `metrics/normalization-profiles.md`.

**10xDEV and SNR are NOT part of the normative core.** They are legacy aliases:
- `10xDEV` → `log_leverage` (application profile in `profiles/application/dev10x.md`)
- `SNR` → `output_fraction`

## Canonical artifacts

| Artifact | Path | Authority |
|----------|------|-----------|
| Normative specification | `SPEC.md` | Authoritative |
| Telemetry envelope schema | `schemas/telemetry-envelope-v0.1.schema.json` | Authoritative |
| Conformance report schema | `schemas/conformance-report-v0.1.schema.json` | Authoritative |
| Metric registry | `metrics/registry.json` | Authoritative |
| Reference implementation | `reference/otep.mjs` | Reference |
| Conformance runner | `conformance/otep-runner.mjs` | Executable |
| Validator | `conformance/otep-validate.mjs` | Executable |
| Python implementation | `python/sigrank_standard/` | Reference |
| Provider adapters | `adapters/` | Informative |
| Privacy modes | `profiles/` | Normative |
| Test vectors | `test-vectors/` | Normative |

**Legacy artifacts** (`docs/`, `schema/`, `examples/fixtures/`) are superseded. See individual `README.md` files in each.

## Repository structure

```text
otep-spec/
├── README.md                          — this file
├── SPEC.md                            — normative protocol specification (authoritative)
├── ARCHITECTURE-DECISION-MEMO.md      — design rationale and decision log
├── REPOSITORY-ARCHITECTURE.md         — repository tree and path authority
├── TERMINOLOGY.md                     — canonical terminology
├── PRIVACY.md                         — privacy modes and content-independence
├── SECURITY.md                        — security considerations
├── GOVERNANCE.md                      — maintainer roles, OEP process, change control
├── DISCLOSURES.md                     — conflict-of-interest disclosures (SRP-GOV-014)
├── CONTRIBUTING.md                    — how to contribute
├── CODE_OF_CONDUCT.md                 — community code of conduct
├── TRADEMARKS.md                      — trademark usage rules
├── CHANGELOG.md                       — version history
├── IMPLEMENTATION-EXPERIENCE.md       — known implementations registry
├── LICENSING-DECISION-MATRIX.md       — licensing analysis
├── OPEN-COMMERCIAL-BOUNDARY.md        — open/closed boundary matrix
├── ADOPTION-ROADMAP.md                — v0.1 → v1.0 roadmap
├── BUSINESS-MODEL.md                  — sustainable commercial model
├── RISK-REGISTER.md                   — risk register with controls
├── BACKLOG-30-60-90.md                — implementation backlog
├── UNRESOLVED-DECISIONS.md            — decisions requiring approval
├── LICENSE                             — code license (Apache 2.0)
├── NOTICE                              — attribution notice
│
├── schemas/                           — canonical JSON schemas
├── metrics/                           — metric registry and definitions
├── profiles/                          — privacy modes + application profiles
├── examples/                          — example payloads
├── test-vectors/                      — conformance test vectors
├── conformance/                       — conformance runner + validator + classes
├── reference/                         — reference implementation
├── adapters/                          — provider adapter mappings
├── oeps/                              — OTEP Extension Proposals
├── python/                            — Python reference implementation
└── integrations/                      — integration examples (TS, Python, MCP, CLI)
```

## Quick start

```bash
# Run the conformance suite
node conformance/otep-runner.mjs

# Validate a payload
node conformance/otep-validate.mjs examples/complete-valid.json --report text

# Compute metrics
node reference/otep.mjs compute-inline 1251211 11296121 128196310 2555179769
```

## Conformance

Six conformance classes are defined in `conformance/classes.md`:

1. **Producer** — emits schema-valid envelopes
2. **Consumer** — ingests and computes metrics identically
3. **Adapter** — maps provider fields correctly
4. **Metric-engine** — computes all 5 metrics correctly
5. **Privacy-profile** — enforces privacy mode rules
6. **Full-platform** — all of the above

**No implementation has been certified as OTEP Conformant yet.** SignalAF is a reference candidate, not a certified implementation.

## Privacy

OTEP is metadata-only. The protocol MUST NOT collect:
- Prompt text or completion text
- Source code, diffs, or file content
- Keystrokes, screen contents, or repository content

Three privacy modes: `public-pseudonymous`, `private-managed-cohort`, `enterprise-isolated`.

## Non-inferences

OTEP metrics do NOT prove: code quality, task correctness, productivity, professional skill, employee performance, business impact, or causal improvement from AI tooling.

## License

- **Specification documents** (`SPEC.md`, `schemas/`, `metrics/`, `profiles/`, `adapters/`, `oeps/`, `examples/`, `test-vectors/`): Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Executable code** (`reference/`, `conformance/`, `integrations/`, `python/`): Apache License 2.0

See `LICENSE` and `NOTICE` for details.

## Governance

This is an experimental v0.1-draft. Governance is currently maintainer-led with a planned transition to a neutral steering committee. See `GOVERNANCE.md`.

## Related

- [SignalAF](https://signalaf.com) — public leaderboard and reference implementation
- [sigrank-standard](https://github.com/SunrisesIllNeverSee/sigrank-standard) — legacy repository (superseded by this repo)

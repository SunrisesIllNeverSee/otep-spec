# TTEOP — Token Telemetry Evaluation Operator Protocol

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.22179383-blue)](https://doi.org/10.5281/zenodo.22179383)
[![npm version](https://img.shields.io/npm/v/tteop-spec.svg)](https://www.npmjs.com/package/tteop-spec)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**An open, vendor-neutral interoperability standard for measuring AI-operator token efficiency.**

TTEOP defines a minimal common language that any AI tool, IDE, observability platform, enterprise analytics system, or independent implementation can produce and consume consistently. It measures how efficiently an operator processes tokens — not cognition, work quality, employee productivity, or business outcomes.

## Current version

**`tteop/0.1-draft`** — experimental public draft. The name "TTEOP" (Token Telemetry Evaluation Operator Protocol) was ratified by founder decision (UD-1, 2026-08-30). No trademark clearance has been performed (UD-9 deferred). See `teps/TEP-0001.md` and `DISCLOSURES.md`.

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
| Reference implementation | `reference/tteop.mjs` | Reference |
| Conformance runner | `conformance/tteop-runner.mjs` | Executable |
| Validator | `conformance/tteop-validate.mjs` | Executable |
| Python implementation | `python/sigrank_standard/` | Reference |
| Provider adapters | `adapters/` | Informative |
| Privacy modes | `profiles/` | Normative |
| Test vectors | `test-vectors/` | Normative |

**Legacy artifacts** (`docs/`, `schema/`, `examples/fixtures/`) are superseded. See individual `README.md` files in each.

## Repository structure

```text
tteop-spec/
├── README.md                          — this file
├── SPEC.md                            — normative protocol specification (authoritative)
├── ARCHITECTURE-DECISION-MEMO.md      — design rationale and decision log
├── REPOSITORY-ARCHITECTURE.md         — repository tree and path authority
├── TERMINOLOGY.md                     — canonical terminology
├── PRIVACY.md                         — privacy modes and content-independence
├── SECURITY.md                        — security considerations
├── GOVERNANCE.md                      — maintainer roles, TEP process, change control
├── MAINTENANCE-CHARTER.md             — reopening and maintenance charter (SRP-GOV-057..076)
├── MAINTAINERS.md                     — maintainer roster (lead + reviewers)
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
├── LICENSES/                           — full license texts (Apache-2.0, CC-BY-4.0)
├── NOTICE                              — attribution notice
├── REUSE.toml                         — SPDX license identifiers (REUSE spec)
│
├── schemas/                           — canonical JSON schemas
├── metrics/                           — metric registry and definitions
├── profiles/                          — privacy modes + application profiles
├── examples/                          — example payloads
├── test-vectors/                      — conformance test vectors
├── conformance/                       — conformance runner + validator + classes
├── reference/                         — reference implementation
├── adapters/                          — provider adapter mappings
├── teps/                              — TTEOP Extension Proposals
├── python/                            — Python reference implementation
├── integrations/                      — integration examples (TS, Python, MCP, CLI)
└── scripts/                           — utility scripts (DCO check, etc.)
```

## Quick start

```bash
# Run the conformance suite
node conformance/tteop-runner.mjs

# Validate a payload
node conformance/tteop-validate.mjs examples/complete-valid.json --report text

# Compute metrics
node reference/tteop.mjs compute-inline 1251211 11296121 128196310 2555179769
```

## Conformance

Six conformance classes are defined in `conformance/classes.md`:

1. **Producer** — emits schema-valid envelopes
2. **Consumer** — ingests and computes metrics identically
3. **Adapter** — maps provider fields correctly
4. **Metric-engine** — computes all 5 metrics correctly
5. **Privacy-profile** — enforces privacy mode rules
6. **Full-platform** — all of the above

**No implementation has been certified as TTEOP Conformant yet.** SignalAF is a reference candidate, not a certified implementation.

## Privacy

TTEOP is metadata-only. The protocol MUST NOT collect:
- Prompt text or completion text
- Source code, diffs, or file content
- Keystrokes, screen contents, or repository content

Three privacy modes: `public-pseudonymous`, `private-managed-cohort`, `enterprise-isolated`.

## Non-inferences

TTEOP metrics do NOT prove: code quality, task correctness, productivity, professional skill, employee performance, business impact, or causal improvement from AI tooling.

## Citation

If you use TTEOP in your research or product, please cite:

```bibtex
@software{mchenry_2026_tteop,
  author       = {McHenry, Deric J},
  title        = {{TTEOP — Token Telemetry Evaluation Operator Protocol:
                  Specification and Reference Implementation, v0.1.3-draft}},
  year         = 2026,
  version      = {0.1.3-draft},
  url          = {https://doi.org/10.5281/zenodo.22179383},
  doi          = {10.5281/zenodo.22179383}
}
```

**DOI:** [10.5281/zenodo.22179383](https://doi.org/10.5281/zenodo.22179383)

See `CITATION.cff` for the full citation metadata.

## License

- **Specification documents** (`SPEC.md`, `schemas/`, `metrics/`, `profiles/`, `adapters/`, `teps/`, `examples/`, `test-vectors/`): Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Executable code** (`reference/`, `conformance/`, `integrations/`, `python/`, `scripts/`): Apache License 2.0
- **Governance documents** (`GOVERNANCE.md`, `MAINTENANCE-CHARTER.md`, `CONTRIBUTING.md`, `MAINTAINERS.md`, etc.): Creative Commons Attribution 4.0 International (CC BY 4.0)

Full license texts are in `LICENSES/`. SPDX identifiers are declared in `REUSE.toml`. See `LICENSE` and `NOTICE` for details.

## Governance

This is an experimental v0.1-draft. Governance is currently maintainer-led with a planned transition to a neutral steering committee. See `GOVERNANCE.md`.

## Related

- [SignalAF](https://signalaf.com) — public leaderboard and reference implementation
- [sigrank-standard](https://github.com/SunrisesIllNeverSee/sigrank-standard) — legacy repository (superseded by this repo)

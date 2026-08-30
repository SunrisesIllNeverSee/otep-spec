# Repository Architecture

**Purpose:** Defines the complete file tree for the TTEOP specification repository and explains the authority of every major path.

---

## Complete Tree

```text
tteop-spec/
├── README.md                          — entry point, quick start, compatibility labels
├── SPEC.md                            — normative protocol specification (authoritative)
├── TERMINOLOGY.md                     — canonical terminology and definitions
├── PRIVACY.md                         — privacy modes and content-independence requirements
├── SECURITY.md                        — security considerations and reporting process
├── GOVERNANCE.md                      — maintainer roles, TEP process, change control
├── CONTRIBUTING.md                    — how to contribute (code, spec, adapters, tests)
├── CODE_OF_CONDUCT.md                 — community code of conduct
├── TRADEMARKS.md                      — trademark usage rules and certification marks
├── CHANGELOG.md                       — version history with semver-style entries
├── IMPLEMENTATION-EXPERIENCE.md       — registry of known implementations and reports
├── ARCHITECTURE-DECISION-MEMO.md      — design rationale and decision log
├── OPEN-COMMERCIAL-BOUNDARY.md        — open/closed boundary matrix
├── ADOPTION-ROADMAP.md                — v0.1 → v1.0 roadmap and launch plan
├── BUSINESS-MODEL.md                  — sustainable commercial model (SignalAF reference)
├── RISK-REGISTER.md                   — risk register with controls
├── BACKLOG-30-60-90.md                — implementation backlog
├── UNRESOLVED-DECISIONS.md            — decisions requiring founder/community approval
├── LICENSE                             — code license (Apache 2.0)
├── NOTICE                              — attribution notice
│
├── schemas/
│   ├── telemetry-envelope-v0.1.schema.json    — canonical telemetry envelope schema
│   ├── operator-record-v0.1.schema.json       — portable interchange record schema
│   ├── conformance-report-v0.1.schema.json    — conformance report output schema
│   └── adapter-definition-v0.1.schema.json    — provider adapter definition schema
│
├── metrics/
│   ├── registry.json                          — machine-readable metric registry
│   ├── yield.md                               — Yield (Υ) metric definition
│   ├── leverage.md                            — Leverage metric definition
│   ├── velocity.md                            — Velocity metric definition
│   ├── output-fraction.md                     — output_fraction metric definition
│   └── log-leverage.md                        — log_leverage metric definition
│
├── profiles/
│   ├── public-pseudonymous.md                 — privacy mode: public pseudonymous
│   ├── private-managed-cohort.md              — privacy mode: private managed cohort
│   ├── enterprise-isolated.md                 — privacy mode: enterprise isolated
│   └── application/
│       └── dev10x.md                          — 10xDEV application profile (optional)
│
├── examples/
│   ├── minimal-valid.json                     — minimal valid telemetry envelope
│   ├── complete-valid.json                    — complete valid telemetry envelope
│   ├── unsupported-cache.json                 — payload with unsupported cache fields
│   ├── invalid-payload.json                   — invalid payload for negative testing
│   ├── signed-envelope.json                   — signed envelope example
│   ├── expected-validation-results.json       — expected results for all examples
│   └── fixtures/                              — conformance test vectors (existing)
│
├── test-vectors/
│   ├── canonical-moses.json                   — MOSES canonical seed vector
│   ├── zero-input.json                        — I=0 boundary case
│   ├── zero-output.json                       — O=0 boundary case
│   ├── missing-cache.json                     — cache unavailable boundary case
│   ├── large-scale.json                       — overflow/scale boundary case
│   └── boundary-cases.json                    — collection of edge cases
│
├── conformance/
│   ├── runner.mjs                             — executable conformance suite (JS)
│   ├── classes.md                             — conformance class definitions
│   ├── report-schema.json                     — conformance report JSON schema
│   ├── example-report.json                    — example conformance report
│   └── tests/
│       ├── runner-self-test.mjs               — JS self-test
│       └── runner-self-test.py                — Python self-test
│
├── reference/
│   ├── IMPLEMENTATION_MAP.md                  — maps spec requirements to implementations
│   └── EXTRACTION_LOG.md                      — provenance of spec content
│
├── adapters/
│   ├── provider-mapping-model.md              — adapter architecture and mapping rules
│   ├── anthropic.md                           — Anthropic provider adapter
│   ├── openai.md                              — OpenAI provider adapter
│   ├── google.md                              — Google provider adapter
│   └── registry.json                          — adapter registry (machine-readable)
│
├── teps/
│   ├── TEP-0000.md                            — TEP process and template
│   ├── TEP-0001.md                            — first TEP (protocol name and versioning)
│   └── TEP-0002.md                            — second TEP (provider adapter extension process)
│
├── integrations/
│   ├── typescript/                            — TypeScript reference implementation
│   ├── python/                                — Python reference implementation
│   ├── cli/                                   — CLI reference implementation
│   └── mcp/                                   — MCP tool reference implementation
│
├── python/
│   ├── pyproject.toml                         — Python package metadata
│   ├── README.md                              — Python package readme
│   └── sigrank_standard/                      — Python package source
│
├── docs/
│   ├── GLOSSARY.md                            — glossary (supplementary to TERMINOLOGY.md)
│   ├── LIMITATIONS.md                         — measurement limitations
│   ├── CONFORMANCE.md                         — conformance guide (supplementary)
│   ├── COMPATIBILITY.md                       — compatibility guide
│   ├── PRODUCT_ARCHITECTURE.md                — product architecture context
│   ├── ENTERPRISE_ADAPTER.md                  — enterprise adapter contract
│   ├── ARCHETYPE_STATUS.md                    — Build Archetype extension status
│   ├── RS05_STATUS.md                         — RS05 extension status
│   └── CANON_RECONCILIATION.md                — canon reconciliation history
│
├── rfc/
│   └── RFC-0001.md                            — legacy RFC (superseded by TEP process)
│
├── reports/
│   └── PHASE1_REVIEW_EXCHANGE.md              — review history
│
└── .github/
    └── workflows/
        └── conformance.yml                    — CI conformance gate
```

---

## Authority of Every Major Path

| Path | Authority | Description |
|------|-----------|-------------|
| `SPEC.md` | **Normative** | The authoritative specification. All other documents defer to it. Contains all MUST/SHOULD/MAY requirements with stable IDs. |
| `TERMINOLOGY.md` | **Normative** | Canonical definitions of all terms used in SPEC.md. Terms defined here are binding. |
| `PRIVACY.md` | **Normative** | Privacy mode definitions and content-independence requirements. Binding on all implementations. |
| `SECURITY.md` | **Normative** | Security considerations, threat model, and reporting process. |
| `GOVERNANCE.md` | **Normative** | Governance process, maintainer roles, TEP lifecycle. Binding on contributors. |
| `CONTRIBUTING.md` | **Informative** | How to contribute. Not normative but follows governance rules. |
| `CODE_OF_CONDUCT.md` | **Normative** | Community behavior standards. Binding on all participants. |
| `TRADEMARKS.md` | **Normative** | Trademark usage rules. Binding on anyone using the protocol name or marks. |
| `CHANGELOG.md` | **Informative** | Version history. Not normative but must be accurate. |
| `IMPLEMENTATION-EXPERIENCE.md` | **Informative** | Registry of known implementations. Not normative but must be truthful. |
| `ARCHITECTURE-DECISION-MEMO.md` | **Informative** | Design rationale. Not normative; explains why decisions were made. |
| `OPEN-COMMERCIAL-BOUNDARY.md` | **Normative** | Defines what is open and what is commercial. Binding on the ecosystem. |
| `ADOPTION-ROADMAP.md` | **Informative** | Roadmap. Not normative; subject to change. |
| `BUSINESS-MODEL.md` | **Informative** | Commercial model reference. Not normative; describes one possible business approach. |
| `RISK-REGISTER.md` | **Informative** | Risk tracking. Not normative but should be maintained. |
| `BACKLOG-30-60-90.md` | **Informative** | Implementation backlog. Not normative; operational document. |
| `UNRESOLVED-DECISIONS.md` | **Informative** | Open questions. Not normative; tracks decisions pending approval. |
| `schemas/` | **Normative** | Machine-readable schemas. Binding on implementations that claim conformance. |
| `metrics/` | **Normative** | Metric registry and definitions. Binding on implementations that compute metrics. |
| `profiles/` | **Normative (when adopted)** | Privacy modes are normative. Application profiles are optional but normative when adopted. |
| `examples/` | **Informative** | Examples illustrate the spec but do not define it. Fixtures in `examples/fixtures/` are normative test vectors. |
| `test-vectors/` | **Normative** | Test vectors are binding — implementations MUST produce the expected results. |
| `conformance/` | **Normative** | Conformance runner and class definitions. Binding on conformance claims. |
| `reference/` | **Informative** | Implementation maps and provenance. Not normative. |
| `adapters/` | **Normative (when adopted)** | Provider adapter definitions are normative when an implementation claims adapter conformance for that provider. |
| `teps/` | **Normative (when accepted)** | Accepted TEPs are normative. Draft TEPs are informative. |
| `integrations/` | **Informative** | Reference implementations demonstrate conformance but do not define it. |
| `python/` | **Informative** | Python package is a reference implementation, not normative. |
| `docs/` | **Mixed** | GLOSSARY, LIMITATIONS, CONFORMANCE are supplementary. PRODUCT_ARCHITECTURE is informative context. |
| `rfc/` | **Deprecated** | Superseded by `teps/`. Retained for history. |
| `.github/workflows/` | **Normative** | CI gates are binding on the repository itself. |

---

## Design Principles

1. **Single source of truth:** `SPEC.md` is authoritative. All other documents defer to it.
2. **Machine-readable where possible:** Schemas, registry, test vectors, and adapter definitions are JSON.
3. **Separation of concerns:** Normative requirements are in root files and `schemas/`, `metrics/`, `conformance/`, `test-vectors/`. Informative context is in `docs/`, `reference/`, `reports/`.
4. **Extensibility:** `teps/` provides a formal extension process. `adapters/` provides provider extensibility. `profiles/` provides application extensibility.
5. **Provenance:** `reference/EXTRACTION_LOG.md` documents where content came from. `IMPLEMENTATION-EXPERIENCE.md` tracks who has implemented what.

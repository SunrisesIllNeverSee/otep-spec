# TTEOP Adoption Roadmap

**Protocol:** TTEOP (Token Telemetry Evaluation Operator Protocol)
**Current version:** `tteop/0.1-draft`
**Document status:** Living document — updated at each stage transition
**Legacy alias:** `sigrank/0.1-draft` (backward-compatible)

---

## 1. Purpose

This roadmap defines the public launch and standards maturation path for TTEOP. It states what ships at each stage, what must be true before a stage can exit, and how the project decides whether and when to pursue neutral-foundation governance.

TTEOP is an **open measurement specification**, not a product. The roadmap is written so that any party — including competitors of the founding implementer — can adopt, implement, and extend the protocol under the same terms as the originator.

**What this roadmap is not:** a promise of ISO/IEC recognition, a guarantee of foundation transfer, or a vendor lock-in schedule. The post-v1 governance evaluation is genuinely open-ended; several acceptable outcomes do not involve a foundation at all.

---

## 2. Launch Narrative

### The ASCII moment for AI measurement

In 1963 the American Standard Code for Information Interchange made text portable across machines that had no other reason to agree. ASCII did not solve every encoding problem, but it gave every system a common 7-bit floor to stand on. Interoperability followed not from a grand bargain but from a small, well-defined contract that anyone could implement.

TTEOP aims for the analogous floor in AI operator measurement. Four non-negative integer primitives — input, output, cache write, cache read — and five derived metrics are small enough that every major provider already exposes them in some form, yet specific enough that two independent implementations producing the same envelope for the same session will compute the same Yield, Leverage, Velocity, SNR, and 10xDEV.

The v0.1 launch is deliberately narrow: one envelope, one schema, five example payloads, a conformance runner, and a governance draft. The goal is not to ship a finished standard. The goal is to ship the smallest contract that makes cross-tool measurement *possible*, then let the field tell us what is missing.

---

## 3. Stage Overview

| Stage | Target | Feedback window | Key exit criterion |
|-------|--------|-----------------|--------------------|
| v0.1 Developer Preview | Immediate | 60 days | Spec, schema, 5 payloads, test vectors, conformance runner, governance draft published |
| v0.5 Implementation Draft | 3–4 months after v0.1 | 30 days | ≥1 external implementation attempt; provider normalization + signature model + OTel mapping landed |
| v0.9 Release Candidate | 6–9 months after v0.1 | 30 days | ≥2 independent implementations passing the frozen conformance suite |
| v1.0 Interoperability Release | 9–12 months after v0.1 | 30 days | Stable core + backward-compatibility guarantee + certification program (if established) |
| Post-v1 Neutral Governance Evaluation | 12+ months after v1.0 | n/a | Foundation-transfer decision documented with prerequisites and gates satisfied or explicitly declined |

---

## 4. Stage 1 — v0.1 Developer Preview

**Target:** Immediate (this release).

### 4.1 Scope

1. Normative specification draft (`docs/SPEC.md`)
2. Canonical JSON Schema (`schema/sigrank-operator-record-v0.1.schema.json`)
3. Five example payloads covering minimal, complete, signed, unsupported-cache, and invalid cases
4. Test vectors and expected validation results
5. Executable conformance runner (`conformance/runner.mjs`) with self-contained fixture suite
6. Governance draft (`docs/GOVERNANCE.md`) covering change control, RFC/TEP process, and compatibility labels
7. Privacy, limitations, glossary, and conformance companion documents

### 4.2 Prerequisites

- Founding implementer (SignalAF) has a passing internal implementation
- Conformance runner is self-contained — no dependency on `@sigrank/cascade` or SignalAF product code
- Spec wording narrowed to token-processing/efficiency construct (no cognition, productivity, or business-outcome claims)
- License split documented: CC BY 4.0 for spec artifacts, Apache 2.0 for executable code

### 4.3 Dependencies

- Public GitHub repository with issue tracker enabled
- Published schema URL resolvable by external validators
- SignalAF public site as a human-readable distribution point

### 4.4 Risks

- **Over-claiming maturity.** v0.1 is `experimental`. Any party that markets it as a finished standard undermines the roadmap. Mitigation: compatibility labels explicitly reserve `SigRank Conformant` until a third party passes the suite independently.
- **Single-implementer bias.** With only SignalAF as a reference, provider normalization rules may reflect one provider's telemetry shape. Mitigation: v0.1 ships normalization as an open problem, not a settled answer.
- **Yield scale-dependency.** The Υ formula is quadratically sensitive to input scale (see `ARCHITECTURE-DECISION-MEMO.md` §2.1). Mitigation: Υ ships as `experimental` with an explicit caveat; v0.5 revisits.

### 4.5 Decision gates

- Gate A: Spec, schema, and runner pass internal review
- Gate B: Governance draft reviewed by at least one external reader
- Gate C: License and NOTICE files verified by legal review

### 4.6 Exit criteria

- All scope items published on a public repository
- Issue tracker open and seeded with known-open questions
- 60-day feedback window formally opened with an announcement

---

## 5. Stage 2 — v0.5 Implementation Draft

**Target:** 3–4 months after v0.1.

### 5.1 Scope

1. Provider normalization rules — how Anthropic, OpenAI, Google, and others map their native usage fields onto I/O/W/R
2. Cryptographic signature model — envelope integrity for signed records
3. OpenTelemetry semantic mapping — TTEOP attributes expressed as OTel semantic conventions
4. Revised metric definitions incorporating v0.1 feedback (including the Υ scale-dependency decision)
5. Expanded conformance suite covering normalization and signature cases

### 5.2 Prerequisites

- At least **one external implementation attempt** — a party other than SignalAF that has tried to emit or consume TTEOP records and reported back
- v0.1 feedback formally triaged and incorporated or explicitly deferred with rationale
- Provider normalization rules reviewed by at least one party with direct provider-API experience

### 5.3 Dependencies

- Feedback from the v0.1 60-day window
- Access to at least two providers' usage-metadata surfaces for normalization validation
- OTel semantic-conventions repository alignment

### 5.4 Risks

- **Normalization drift.** Providers change their usage metadata shape frequently. Rules written against today's API may be stale by v0.5. Mitigation: normalization is versioned per provider and dated.
- **Signature model over-design.** A heavyweight PKI scheme will deter implementers. Mitigation: v0.5 ships the minimal integrity model sufficient to detect tampering, not a full chain-of-trust.
- **OTel mapping churn.** OTel semantic conventions evolve. Mitigation: mapping is pinned to a dated OTel release and re-validated each stage.

### 5.5 Decision gates

- Gate D: External implementation attempt documented (pass or fail — either counts)
- Gate E: Provider normalization rules survive a cross-provider validation pass
- Gate F: Signature model reviewed by at least one security-knowledgeable external reader

### 5.6 Exit criteria

- Normalization, signature, and OTel mapping sections are normative in the spec
- Conformance suite extended and passing
- 30-day feedback window opened

---

## 6. Stage 3 — v0.9 Release Candidate

**Target:** 6–9 months after v0.1.

### 6.1 Scope

1. Frozen metric definitions — no formula changes after this point without a major version bump
2. Complete conformance suite — every normative rule in the spec has at least one test vector
3. Two or more independent implementations passing the suite
4. Backward-compatibility policy operationalized with a compatibility test

### 6.2 Prerequisites

- **Implementation #2 from an independent organization** passing the conformance suite
- All v0.5 feedback incorporated
- No open `experimental`-to-`stable` promotions blocked by unresolved feedback

### 6.3 Dependencies

- A second implementing organization willing to run the suite and publish results
- Stable provider normalization rules across at least two providers

### 6.4 Risks

- **Single-organization implementations.** Two implementations from the same employer do not satisfy independence. Mitigation: independence is defined by organization, not individual.
- **Conformance suite gaps.** A suite that passes two implementations may still miss edge cases. Mitigation: suite coverage is audited against every normative rule before freeze.
- **Premature freeze.** Freezing a flawed metric definition locks in a bug. Mitigation: freeze requires zero open P1 issues against metric definitions.

### 6.5 Decision gates

- Gate G: Implementation #2 passes the suite, results published
- Gate H: Conformance coverage audit complete, every normative rule tested
- Gate I: Zero open P1 issues against metric definitions

### 6.6 Exit criteria

- Metric definitions frozen
- Conformance suite complete and passing on ≥2 independent implementations
- 30-day feedback window opened

---

## 7. Stage 4 — v1.0 Interoperability Release

**Target:** 9–12 months after v0.1.

### 7.1 Scope

1. Stable core — the v1.0 metric and envelope definitions are `stable` maturity
2. Backward-compatibility guarantee — v1.0 records are consumable by v1.x tools; breaking changes require v2.0
3. Conformance certification program (if established by this point) — a lightweight, public process for an implementation to earn the `SigRank Conformant` label
4. Final governance document reflecting v1.0 change-control rules

### 7.2 Prerequisites

- Two or more independent implementations passing the frozen suite
- Six or more months of stable governance observed (no founder-only decisions overriding the documented process)
- Backward-compatibility test passing against v0.9 records

### 7.3 Dependencies

- Certification program design (may be deferred post-v1.0 if not ready)
- Public registry of conformant implementations (even a simple list in the repo)

### 7.4 Risks

- **Certification scope creep.** A heavy certification program delays v1.0. Mitigation: certification is optional at v1.0; the label can be earned by publishing suite results even without a formal program.
- **Governance instability.** If the founder retains unilateral control, independence claims are hollow. Mitigation: v1.0 governance requires a documented decision log with no undocumented overrides.
- **Compatibility breakage.** A v1.0 change that breaks v0.9 consumers invalidates the guarantee. Mitigation: compatibility test is a release gate.

### 7.5 Decision gates

- Gate J: ≥2 independent implementations passing
- Gate K: ≥6 months stable governance observed
- Gate L: Backward-compatibility test green

### 7.6 Exit criteria

- v1.0 spec published with `stable` core
- Compatibility guarantee documented and tested
- Certification program shipped or explicitly deferred with a public plan

---

## 8. Stage 5 — Post-v1 Neutral Governance Evaluation

**Target:** 12+ months after v1.0.

### 8.1 Scope

Evaluate whether to transfer TTEOP governance to a neutral foundation (e.g., Linux Foundation, Eclipse Foundation, or another suitable home). This stage produces a **decision**, not necessarily a transfer. Declining to transfer is an acceptable outcome if the rationale is sound.

### 8.2 Prerequisites

- v1.0 has been stable for at least 12 months
- At least two independent organizations are active maintainers, not just implementers
- Governance decision log is complete and public
- No open legal or IP encumbrances on the spec artifacts

### 8.3 Dependencies

- A willing foundation with a relevant SIG or working group
- Funding model for legal transfer and ongoing maintenance
- Trademark status for "TTEOP" and "SigRank" clarified

### 8.4 Risks

- **Premature transfer.** Moving to a foundation before the community can sustain maintenance can orphan the spec. Mitigation: transfer requires ≥2 active non-founder maintainers.
- **Foundation mismatch.** Not every foundation is a good fit. Mitigation: evaluate at least two foundations against explicit criteria before committing.
- **Stall after transfer.** Foundation processes can slow iteration. Mitigation: negotiate a lightweight working-group charter, not a heavyweight committee.
- **Loss of identity.** A transfer that renames or buries the protocol can reset adoption. Mitigation: retain the TTEOP name and version history through any transfer.

### 8.5 Decision gates

- Gate M: ≥12 months post-v1.0 stability demonstrated
- Gate N: ≥2 active non-founder maintainers
- Gate O: Foundation evaluation complete with a written recommendation

### 8.6 Exit criteria

- A documented decision: transfer to a named foundation, defer, or decline
- If transferring: transfer plan with timeline, funding, and charter
- If declining or deferring: written rationale and re-evaluation trigger

### 8.7 Possible paths

This stage deliberately leaves multiple outcomes open:

1. **Transfer to a neutral foundation.** Best fit when adoption is broad and the community can sustain maintenance independently.
2. **Remain founder-stewarded with a public advisory board.** Best fit when adoption is growing but the community is not yet self-sustaining.
3. **Merge into an existing standards effort.** Best fit if a related measurement standard emerges and TTEOP's core can be adopted as a profile.
4. **Remain a lightweight community spec.** Best fit when the spec is stable, adoption is niche, and foundation overhead is not justified.

**No path is pre-selected.** The evaluation at Stage 5 determines which path fits the evidence at that time.

---

## 9. Documentation Package

| Stage | Documents shipped |
|-------|-------------------|
| v0.1 | SPEC, GLOSSARY, PRIVACY, CONFORMANCE, LIMITATIONS, GOVERNANCE, CHANGELOG, schema, 5 examples, test vectors, conformance runner, ADOPTION-ROADMAP, INTEGRATION-ADOPTION-PLAN |
| v0.5 | All v0.1 docs updated; provider normalization guide; signature model guide; OTel mapping guide |
| v0.9 | All v0.5 docs updated; conformance coverage report; implementation registry |
| v1.0 | All v0.9 docs updated; certification program doc (if established); final governance charter; backward-compatibility reference |
| Post-v1 | Foundation evaluation report; transfer plan (if applicable) |

---

## 10. Explainer Assets

| Asset | Stage | Owner |
|-------|-------|-------|
| Launch blog post — "The ASCII moment for AI measurement" | v0.1 | SignalAF (founding implementer) |
| One-page summary (printable PDF + Markdown) | v0.1 | Spec maintainers |
| Demo video — emitting and validating an TTEOP record | v0.1 | SignalAF |
| Provider normalization walkthrough | v0.5 | Spec maintainers |
| OTel mapping demo | v0.5 | Spec maintainers |
| Conformance suite walkthrough | v0.9 | Spec maintainers |
| v1.0 announcement and certification explainer | v1.0 | Spec maintainers |

Explainer assets are licensed CC BY 4.0 alongside the spec so that any party may redistribute them.

---

## 11. Implementation Demonstration

**Implementation #1: SignalAF.** SignalAF serves as the founding reference implementation. Its role is to demonstrate that the spec is implementable end-to-end and to provide a live, human-readable distribution point at `signalaf.com`.

SignalAF's responsibilities as Implementation #1:

- Emit valid TTEOP records from a production system
- Run the conformance suite in CI and publish results
- Provide a public leaderboard consuming TTEOP records (a consumer-side demonstration, not part of the open spec)
- Refrain from claiming conformance superiority over other implementations

SignalAF's boundaries:

- Leaderboard logic, anti-gaming, and proprietary cohorts are **not** part of TTEOP
- SignalAF does not hold veto power over spec changes after v1.0 governance is in place
- SignalAF's commercial extensions are clearly labeled as extensions, not core

---

## 12. Partner Announcement

**Target partners for Implementation #2.** The roadmap requires an independent organization to attempt implementation by v0.5 and to pass the conformance suite by v0.9. Candidate partner profiles (not commitments):

- An AI coding tool vendor (Claude Code, Cursor, Copilot, Windsurf, or similar) that already exposes token usage and wants a neutral export format
- An observability platform (Langfuse, Helicone, or similar) that consumes operator telemetry and wants a standard ingestion shape
- An enterprise analytics team that needs a portable interchange format across multiple AI tools

A partner announcement is **not** a precondition for v0.1. The v0.1 launch is designed to attract partners by being useful immediately, not by requiring prior commitment.

---

## 13. Public Issue Tracker

The project uses **GitHub Issues** on the public repository as the sole public issue tracker. All feedback, bug reports, normalization questions, and governance proposals are routed there.

Conventions:

- `feedback` label for items raised during a feedback window
- `normalization` label for provider-mapping questions
- `conformance` label for suite and test-vector issues
- `governance` label for process and decision-log questions
- `oep` label for TTEOP Extension Proposals (the RFC equivalent)

No private issue channel exists for spec feedback. Security reports are handled separately (§14).

---

## 14. Feedback Windows

| Stage | Window length | Start trigger |
|-------|---------------|---------------|
| v0.1 | 60 days | Public launch announcement |
| v0.5 | 30 days | v0.5 draft publication |
| v0.9 | 30 days | RC publication |
| v1.0 | 30 days | v1.0 publication |

Feedback received after a window closes is still welcome and triaged, but it does not block the next stage. Items that cannot be addressed in the current stage are tagged for the next stage with a public note.

---

## 15. Security Reporting Process

**Temporary channel:** `security@signalaf.com`

Until a neutral security contact is established (target: v0.5 or upon foundation transfer, whichever comes first), vulnerability reports related to the spec, schema, or conformance runner are sent to `security@signalaf.com`.

Reporting expectations:

- Do **not** open a public GitHub Issue for security reports
- Include a description of the issue and, if possible, a minimal reproduction
- Allow up to 90 days for a response before public disclosure
- PGP key publication is targeted for v0.5

This channel is temporary by design. A neutral security contact is a prerequisite for foundation transfer at Stage 5.

---

## 16. Adoption KPIs

The project tracks the following indicators to gauge adoption health. These are signals, not targets — no KPI is gamed or incentivized.

| KPI | v0.1 baseline | v0.9 target | v1.0 target |
|-----|---------------|-------------|-------------|
| GitHub stars | track | trending upward | sustained growth |
| Independent implementations | 1 (SignalAF) | ≥2 passing | ≥2 passing, ≥3 attempted |
| Adapters published | 1 (sigrank-mcp) | ≥3 | ≥5 |
| Conformance passes by external parties | 0 | ≥2 | ≥3 |
| Issue engagement (unique commenters) | track | ≥10 non-founder | ≥20 non-founder |
| Provider normalization rules documented | 0 | ≥2 providers | ≥3 providers |

KPIs are reviewed at each stage transition and published in the stage exit report. Missing a KPI target does not block a stage exit unless the target is also a formal exit criterion (§4.6, §5.6, §6.6, §7.6).

---

## 17. Change Log

| Date | Change |
|------|--------|
| 2026-08-28 | Initial roadmap drafted alongside v0.1-draft spec |

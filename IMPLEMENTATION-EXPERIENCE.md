# Implementation Experience

**Document status:** Informative — maintained as implementations are completed
**Last updated:** 2026-08-30

---

## Purpose

This document tracks known implementations of the TTEOP specification, their conformance status, and lessons learned. It is a requirement for v1.0 that at least 2 independent implementations pass the conformance suite.

---

## Implementation Registry

| # | Implementation | Organization | Type | Conformance class | Status | Independent? |
|---|----------------|-------------|------|-------------------|--------|--------------|
| 1 | SignalAF | SunrisesIllNeverSee | Full-platform | Full-platform | Reference candidate (v0.1-draft) | No — reference product |
| 2 | @sigrank/cascade | SunrisesIllNeverSee | Metric-engine | Metric-engine | Reference candidate (v0.1-draft) | No — reference math library |
| 3 | sigrank-mcp | SunrisesIllNeverSee | Producer + Metric-engine | Producer + Metric-engine | Reference candidate (v0.1-draft) | No — reference instrument |
| 4 | *Pending* | *Seeking* | *Target: IDE or observability platform* | *Target: Producer or Consumer* | *Not started* | *Yes — target* |

> **Note:** No implementation has been certified as TTEOP Conformant yet. The implementations above are reference candidates maintained by the specification author. Certification requires passing the conformance suite via an independent harness, not a self-test.

---

## Independence Criteria

An implementation is **independent** if:

1. **Organizational independence:** The implementing organization is not the same as the specification maintainer's organization and does not share ownership, funding control, or governance authority with the maintainer.

2. **Shared-library restrictions:** The implementation MUST NOT import or depend on the reference implementation (`@sigrank/cascade`) for metric computation. It MAY use the conformance runner for testing but MUST implement its own metric computation logic.

3. **Required test coverage:** The implementation MUST pass all mandatory tests for its claimed conformance class using the published conformance runner and test vectors.

4. **Implementation-experience reporting:** The implementer MUST submit an implementation-experience report documenting:
   - What was implemented
   - Which conformance class was targeted
   - Which tests passed/failed
   - Any deviations from the specification
   - Any ambiguities or gaps discovered in the specification
   - Suggestions for improvement

5. **Interoperability demonstration:** The implementation MUST demonstrate interoperability with at least one other implementation by:
   - Producing envelopes that another implementation can consume, OR
   - Consuming envelopes that another implementation produces

---

## Implementation #1: SignalAF

**Organization:** SunrisesIllNeverSee
**Conformance class:** Full-platform
**Status:** Reference candidate (v0.1-draft) — not certified
**Independent:** No — SignalAF is the reference product

**What was implemented:**
- Telemetry envelope production (producer)
- Telemetry ingestion and metric computation (consumer + metric-engine)
- Privacy mode enforcement (privacy-profile)
- Provider adapters for Anthropic, OpenAI
- Public leaderboard (commercial layer)

**Conformance results:**
- 151/151 conformance assertions pass (JS runner — `conformance/tteop-runner.mjs`)
- 13/13 conformance fixtures pass (JS runner)
- 13/13 conformance fixtures pass (Python runner)
- Canonical MOSES seed vector: Υ=18436.98 ✓
- Cross-repository conformance: sigrank-app + sigrank-mcp both pass same fixtures

**Known deviations:** None claimed at v0.1-draft; however, this is a self-test by the reference implementation, not independent validation. See "Known Deviations and Gaps" table below for deferred items.

**Lessons learned:**
- The four-pillar model is sufficient for initial interoperability
- Provider cache semantics are the largest source of complexity (OpenAI double-counting)
- The null/zero distinction is critical and must be tested explicitly
- The conformance runner being self-contained (no dependency on @sigrank/cascade) was essential for third-party credibility

---

## Implementation #2: [Pending]

**Target:** IDE plugin, observability platform, or independent open-source project
**Status:** Not yet recruited

**Recruitment criteria:**
- Organization independent of SunrisesIllNeverSee
- Implements at least Producer or Consumer conformance class
- Passes all mandatory tests for claimed class
- Submits implementation-experience report

**Candidate pipeline:**
- IDE extensions (VS Code, JetBrains) — would produce telemetry from IDE-integrated AI tools
- Observability platforms (Langfuse, Helicone, Phoenix) — would consume TTEOP envelopes
- Open-source collectors — would produce TTEOP envelopes from CLI tools
- Academic/research projects — would consume TTEOP envelopes for studies

---

## Minimum Evidence Required Before v1.0

Before v1.0 can be released:

1. ✅ Implementation #1 (SignalAF) passes self-test conformance — DONE (but self-test, not independent certification)
2. ⬜ Implementation #1 certified by independent harness — PENDING
3. ⬜ Implementation #2 (independent) passes at least one conformance class — PENDING
4. ⬜ Interoperability demonstration between #1 and #2 — PENDING
5. ⬜ Implementation-experience reports from both — #1 DONE, #2 PENDING
6. ⬜ No unresolved specification ambiguities reported by either implementer — PENDING

---

## Known Deviations and Gaps

| Reporter | Issue | Status |
|----------|-------|--------|
| SignalAF | Python conformance runner had weaker validation than JS runner | Fixed (2026-08-28) |
| SignalAF | No provider adapter for Google Gemini | Deferred to v0.2 |
| SignalAF | No cryptographic signature model | Deferred to v0.2 |
| SignalAF | No OpenTelemetry semantic mapping | Deferred to v0.3 |

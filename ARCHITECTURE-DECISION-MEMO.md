# Architecture Decision Memo

**Document status:** Draft for founder review
**Author:** DREP1 (lead architect)
**Date:** 2026-08-28
**Supersedes:** Prior ad-hoc architecture decisions in `docs/SPEC.md` v0.1-draft

---

## 1. Executive Assessment of the Current Concept

### 1.1 What exists

The SigRank ecosystem currently has a working v0.1-draft measurement specification with:

- Four token-telemetry pillars: `input` (I), `output` (O), `cache_write` (W), `cache_read` (R)
- Five derived metrics: Yield (Υ), Leverage, Velocity, output_fraction, log_leverage
- A JSON Schema for portable interchange records
- An executable conformance runner (JavaScript + Python) with 13 fixtures
- A reference math package (`@sigrank/cascade`)
- A live product (SignalAF) and CLI instrument (`sigrank-mcp`)
- Boundary documentation separating open core from commercial extensions

### 1.2 What is correct

1. **The four-pillar model is sound as a minimal common vocabulary.** Input, output, cache write, and cache read are the four quantities that every major LLM provider exposes in some form. Using them as the canonical primitives is defensible.

2. **The null semantics are well-designed.** The distinction between "zero" (observed value of 0) and "null" (unavailable/unsupported) is critical and correctly specified. The prohibition against fabricating missing telemetry is correct.

3. **The privacy boundary is correctly drawn.** Metadata-only measurement (token counts, not prompt/completion text) is the right architectural choice for an open standard. It enables broad adoption without privacy liability.

4. **The open/closed boundary is conceptually correct.** Keeping leaderboard logic, anti-gaming, and proprietary cohorts outside the open specification is the right call.

5. **The conformance runner is genuinely self-contained.** It does not depend on `@sigrank/cascade` or any SignalAF code. A third party can replace the functions and run the same fixtures. This is a real foundation for interoperability.

### 1.3 What needs correction

See §2 below.

### 1.4 Strategic verdict

The concept is viable but is currently a **product specification masquerading as an open standard**. The v0.1-draft was extracted from a commercial product (`sigrank-app`) and carries product assumptions that must be made explicit and neutralized before it can serve as a vendor-neutral interoperability standard. The mathematical core is sound; the governance, provider-neutrality, and conformance infrastructure need substantial upgrading.

The "ASCII moment" ambition is achievable but requires treating this as a protocol design problem, not a documentation extraction problem.

---

## 2. Critical Corrections to the Proposed Plan

### 2.1 The Υ (Yield) formula has a scale-dependency problem

**Issue:** `Υ = (R × O) / I²` squares the input, making Υ quadratically sensitive to request scale. An operator who sends the same prompt with 2× more fresh input tokens (e.g., a longer system prompt that is not cached) will see Υ drop by 4×, even if their actual efficiency is unchanged.

**Analysis:**
- Υ = Leverage × Velocity = (R/I) × (O/I)
- Both factors divide by I, so I appears in the denominator twice
- This is intentional in the original design: it penalizes operators who send large uncached inputs
- But it makes Υ non-monotonic in a way that is hard to interpret: doubling both input and output (keeping the same ratio) halves Υ if cache_read stays constant

**Recommendation:** Retain Υ as a registered experimental metric with its current formula, but:
1. Explicitly document the scale dependency as a known limitation
2. Register a normalized variant `Υ_norm = (R × O) / I²` computed on window-normalized inputs (see §2.2)
3. Do not make Υ the sole headline metric; present Leverage and Velocity alongside it
4. Require any public claim using Υ to disclose the observation window and aggregation method

**Do not change the formula.** Changing it would break the frozen MOSES seed invariant (`Υ 18436.98` for seeds `1_251_211, 11_296_121, 128_196_310, 2_555_179_769`). Instead, document the limitation and provide normalization profiles.

### 2.2 Observation-window semantics are undefined

**Issue:** The v0.1-draft does not specify whether token counts are per-request, per-session, per-task, or per-window. This is the single largest source of potential interoperability failure.

**Correction:** The specification MUST define:
- A canonical observation window (start timestamp, end timestamp, duration)
- Aggregation rules for summing across requests within a window
- That all four pillars are cumulative sums within the window
- That metrics are computed from the aggregated sums, not averaged from per-request metrics

### 2.3 Provider cache semantics are not mapped

**Issue:** The v0.1-draft says "cache semantics vary by provider" but does not provide adapter mappings. Different providers expose cache differently:
- Anthropic: `cache_creation_input_tokens` and `cache_read_input_tokens` as separate fields
- OpenAI: `cached_tokens` inside `prompt_tokens_details`, no separate cache creation field
- Google: `cached_content_token_count` in response metadata

**Correction:** The specification MUST include a provider-adapter mapping model that:
- Defines how each provider's native fields map to I/O/W/R
- Handles providers that report cached tokens inside total input (double-counting risk)
- Handles providers that expose cache reads but not cache creation
- Is extensible via adapter definitions without requiring spec changes

### 2.4 "10xDEV" must not be in the normative core

**Issue:** The name "10xDEV" implies a developer productivity classification ("10x developer") that the protocol explicitly disclaims. Having it in the normative core creates a tension with the non-inference principles.

**Correction:** Move 10xDEV to an optional application profile. Retain `log10(R/I)` as a registered metric under a neutral name (e.g., `cache_depth` or `log_leverage`) in the metric registry. The "10xDEV" label becomes a SignalAF application-profile alias, not a normative metric name.

**Frozen invariant preservation:** The MOSES seed computation `log10(R/I) = log10(2555179769/1251211) = 3.31` is preserved. Only the name changes in the normative layer.

### 2.5 SNR is undefined in the current concept

**Issue:** The owner's brief lists "Signal-to-noise ratio" as a proposed derived concept but the v0.1-draft defines it as `S = O / (I + O)`. This is not a signal-to-noise ratio in any standard signal-processing sense. It is an output fraction.

**Correction:** Rename the metric to `output_fraction` in the normative registry. If a true SNR concept is needed, define it separately with explicit signal/noise definitions. The current formula is useful (it measures what fraction of total token flow is output) but mislabeling it as "SNR" creates false expectations.

**Frozen invariant preservation:** The value `0.9003` for the MOSES seed is preserved. Only the name changes.

### 2.6 The specification lacks stable requirement IDs

**Issue:** The v0.1-draft uses prose without stable identifiers. Every normative requirement needs a stable ID, permanent anchor, conformance test, and failure condition per the non-negotiable principles.

**Correction:** All normative requirements in the new SPEC.md use `SRP-*` identifiers (e.g., `SRP-DATA-001`, `SRP-PRIV-004`, `SRP-CONF-012`).

### 2.7 Conformance is binary when it should be class-based

**Issue:** The v0.1-draft has a single "SigRank Compatible" label. Real interoperability requires multiple conformance classes (producer, consumer, adapter, metric-engine, privacy-profile, full-platform).

**Correction:** Define six conformance classes with distinct mandatory/optional test sets.

### 2.8 No independent implementation exists

**Issue:** SignalAF is Implementation #1. `@sigrank/cascade` is the reference math library. No second implementation from an independent organization exists. The spec says "SigRank Conformant is reserved until third-party validation" but does not define what counts.

**Correction:** Define independent implementation criteria. Recruit Implementation #2 from an IDE, observability platform, or open-source project.

### 2.9 Governance is product-owned, not neutral

**Issue:** The standard is maintained inside the SigRank ecosystem. Changes go through a private process. This is acceptable for v0.x but must have a transition path.

**Correction:** Define a lightweight governance model with maintainer roles, COI disclosure, TEP process, and foundation-readiness criteria.

### 2.10 No provenance or integrity model

**Issue:** The v0.1-draft has no signature or integrity requirements. Records can be fabricated without detection.

**Correction:** Define provenance levels (self-reported, collector-attested, platform-verified, cryptographically-signed) and an optional integrity model using detached signatures.

---

## 3. Problem the Protocol Solves

There is no vendor-neutral, open way to measure and compare how human operators use AI systems across different tools, providers, and models. Each tool (Cursor, Copilot, Claude Code, Windsurf) collects token telemetry in its own format. Each provider (Anthropic, OpenAI, Google) exposes cache semantics differently. Observability platforms (Langfuse, Helicone) define their own metrics. Enterprise analytics systems cannot compare AI usage across teams that use different tools.

This fragmentation means:
- Operators cannot compare their efficiency across tools
- Teams cannot benchmark AI usage patterns across tools
- Researchers cannot study operator behavior without building custom collectors
- Enterprises cannot make data-driven tooling decisions across heterogeneous stacks
- No open metric definitions exist that any tool can produce and any consumer can interpret

The protocol solves this by defining a minimal common telemetry envelope and metric set that any tool can produce and any consumer can interpret consistently.

---

## 4. Intended Users

| User | Role | What they need from the protocol |
|------|------|----------------------------------|
| AI tool/IDE developers | Producers | A standard format to emit token telemetry |
| Observability platform developers | Consumers | A standard format to ingest and aggregate |
| Enterprise analytics teams | Consumers | A standard format for cross-tool benchmarking |
| AI operators (developers, researchers) | Subjects | A standard way to understand their own efficiency |
| Researchers | Consumers | A standard format for reproducible studies |
| Open-source collector maintainers | Producers | A standard target format for their collectors |
| Standards organizations | Observers | A reference for potential formal standardization |

---

## 5. Non-goals

The protocol does NOT:
- Define code quality, task correctness, or productivity metrics
- Require collection of prompt text, completion text, source code, or diffs
- Define public ranking or certification systems (these are application-layer)
- Define anti-gaming or abuse-prevention logic (these are platform-layer)
- Define proprietary cohort composition or eligibility thresholds
- Claim causal relationships between token efficiency and outcomes
- Replace provider-native telemetry; it maps to it
- Define cost or pricing models (these are provider-specific)

---

## 6. Why Interoperability Is Needed

Without a common protocol:
1. **Lock-in:** Tools that collect telemetry in proprietary formats create switching costs
2. **Non-comparability:** Metrics computed from different tools cannot be compared
3. **Research barriers:** Academic studies must build custom collectors per tool
4. **Enterprise fragmentation:** Cross-tool analytics require bespoke integrations
5. **No neutral ground:** Every platform defines its own "efficiency" metric, making claims unverifiable

With a common protocol:
1. Any tool can emit standard-conformant telemetry
2. Any consumer can ingest it without knowing the source tool
3. Metrics are computed identically regardless of implementation
4. Researchers can use off-the-shelf collectors
5. Enterprises can benchmark across heterogeneous stacks
6. Claims are verifiable against published test vectors

---

## 7. What Belongs in the Core Protocol

| Component | In core? | Rationale |
|-----------|----------|-----------|
| Telemetry envelope (I/O/W/R + metadata) | Yes | Minimal common vocabulary |
| Metric definitions (Yield, Leverage, Velocity, output_fraction, log_leverage) | Yes | Computable from core telemetry |
| Null/missing semantics | Yes | Critical for interoperability |
| Observation-window semantics | Yes | Required for comparable aggregation |
| Provider-adapter mapping model | Yes | Required for provider neutrality |
| Privacy modes | Yes | Required for deployment flexibility |
| Validation rules | Yes | Required for conformance |
| Provenance levels | Yes | Required for trust differentiation |
| Versioning and extension mechanism | Yes | Required for evolution |
| Conformance classes | Yes | Required for precise claims |
| 10xDEV classification | No — application profile | Implies productivity assessment |
| Build Archetypes | No — commercial extension | Descriptive classification, not measurement |
| RS05 class tiers | No — commercial extension | Scale/qualification stage, not measurement |
| Leaderboard logic | No — commercial product | Ranking is application-layer |
| Anti-gaming controls | No — commercial product | Abuse prevention is platform-layer |
| Private cohorts | No — commercial product | Cohort composition is product-layer |
| Enterprise SSO/audit/SLA | No — commercial product | Deployment features, not protocol |

---

## 8. What Belongs in Metric Profiles

Metric profiles are versioned, optional extensions to the core metric set:
- **Application profiles** (e.g., 10xDEV developer classification) — combine core metrics with interpretation rules
- **Normalization profiles** (e.g., window-normalized Yield) — define how to normalize core metrics for specific comparison contexts
- **Provider profiles** (e.g., Anthropic adapter) — map provider-native fields to core telemetry

Profiles are registered, versioned, and testable but not required for base conformance.

---

## 9. What Belongs in Commercial Products

Commercial products (SignalAF and others) may build on the open protocol to provide:
- Hosted leaderboard presentation and ranking
- Private and network-derived reference cohorts
- Proprietary eligibility thresholds and anti-gaming
- Curated anomaly models and abuse signals
- Enterprise SSO, audit, deployment, and SLA features
- Managed analytics, support, and accreditation
- Build Archetype classification and RS05 tiering

These MUST NOT alter the open metric definitions. They MAY define eligibility criteria for their own leaderboards and MAY refuse to display protocol-conformant records that fail private quality checks, but they MUST NOT silently redefine what the metrics mean.

---

## 10. Recommended Neutral Protocol Name and Abbreviation

**Recommended name:** **TTEOP** — Token Telemetry Evaluation Operator Protocol

**Rationale:**
- "Operator" centers the human, not the tool or model
- "Token Efficiency" describes what is measured without overclaiming
- "Protocol" signals interoperability, not just a specification
- Pronounceable as a word ("oh-tep")
- No trademark conflicts identified in preliminary search (requires formal clearance — see UNRESOLVED-DECISIONS.md)

**Alternative considered:** AOMS (AI Operator Measurement Standard) — rejected because "AI Operator" is ambiguous (could mean an human operating AI or an AI agent operating autonomously).

**Migration path:** The spec version string transitions from `sigrank/0.1-draft` to `tteop/0.1-draft` at v0.1 stable release. The `sigrank/0.1-draft` string remains valid as a legacy alias for backward compatibility.

**[REQUIRES FOUNDER APPROVAL]** — See UNRESOLVED-DECISIONS.md §1.

---

## 11. Should "ASCII for AI Efficiency" Remain Positioning?

**Yes.** "ASCII for AI efficiency" is effective positioning language for launch narratives and explainer assets. It communicates the ambition (minimal common language, universal interoperability) without being a formal name.

It should NOT be the protocol name because:
- "ASCII" is a registered trademark of the American Standards Association
- Using it as a protocol name creates trademark confusion
- The analogy is aspirational, not literal (ASCII defines character encoding; this defines measurement telemetry)

**Recommendation:** Use "the ASCII moment for AI measurement" in marketing and documentation. Use TTEOP as the protocol name in normative documents.

---

## 12. Major Unresolved Technical Decisions

1. **Protocol name** — TTEOP proposed, requires founder approval and trademark clearance
2. **Υ normalization** — whether to define a window-normalized variant as a separate registered metric
3. **Provider double-counting** — how to handle providers that report cached tokens inside total input (subtract or accept?)
4. **Streaming semantics** — how to count tokens in streaming responses (per-chunk or per-completion)
5. **Multi-model workflows** — how to attribute tokens when a single operator session uses multiple models
6. **Tool-call attribution** — how to attribute tokens when an agent makes tool calls that generate sub-requests
7. **Signature algorithm** — which signature scheme for the integrity model (Ed25519, HMAC, or both)
8. **Registry governance** — whether the metric registry is in-repo or a separate IANA-style registry
9. **Foundation transfer** — when and whether to approach a neutral foundation (requires v1.0 + 2+ implementations)
10. **Conformance certification** — whether to offer paid certification and under what trademark rules

---

## 13. Recommended v0.1 Scope

The v0.1 developer preview includes:

**In scope:**
- Canonical telemetry envelope (I/O/W/R + metadata)
- Five registered metrics (Yield, Leverage, Velocity, output_fraction, log_leverage)
- Null/missing/zero/unsupported semantics
- Observation-window definition
- Provider-adapter mapping model (with 3 initial adapters: Anthropic, OpenAI, Google)
- Three privacy modes (public-pseudonymous, private-managed-cohort, enterprise-isolated)
- JSON Schema for telemetry envelope
- 5 example payloads + boundary test vectors
- Conformance runner with 6 conformance classes
- Governance document with TEP process
- Licensing (CC BY 4.0 for spec, Apache 2.0 for code)
- Open/commercial boundary matrix
- Risk register
- 30/60/90-day backlog

**Explicitly deferred to v0.2+:**
- Provider normalization rules (beyond initial 3 adapters)
- Longitudinal definitions (movement, stability, divergence)
- Organizational extensions (topology, capability concentration)
- Cryptographic signature model (v0.2)
- OpenTelemetry semantic mapping (v0.3)
- Formal standardization path (post-v1.0)

---

## 14. Repository Architecture

See `REPOSITORY-ARCHITECTURE.md` for the complete proposed tree.

---

## 15. Decision Log

| Date | Decision | Status |
|------|----------|--------|
| 2026-08-28 | Retain Υ formula, document scale dependency | Accepted |
| 2026-08-28 | Move 10xDEV to application profile, rename to log_leverage in core | Proposed — requires founder approval |
| 2026-08-28 | Rename SNR to output_fraction in core | Proposed — requires founder approval |
| 2026-08-28 | Propose TTEOP as neutral protocol name | Proposed — requires founder approval + trademark clearance |
| 2026-08-28 | Define 6 conformance classes | Accepted |
| 2026-08-28 | Define 3 privacy modes | Accepted |
| 2026-08-28 | Define provider-adapter mapping model | Accepted |
| 2026-08-28 | Define observation-window semantics | Accepted |

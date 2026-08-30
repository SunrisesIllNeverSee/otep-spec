# OTEP v0.1-draft — 30/60/90-Day Implementation Backlog

**Status:** Draft
**Last updated:** 2025-01-15
**Owner:** OTEP Working Group
**Specification version:** v0.1-draft

This document tracks the implementation backlog for the OTEP (Operator Token Efficiency Protocol) v0.1-draft specification package. It is organized into three 30-day phases: Foundation, Validation, and Expansion. Each item lists a task, owner, dependency, acceptance criteria, and status.

**Owner legend:**
- **DREP1** — Domain Representative 1 (primary spec author / founder)
- **DREP2** — Domain Representative 2 (secondary maintainer)
- **Community** — Open contributors, working group, or external implementers

---

## Phase 1: Days 1–30 (Foundation)

The Foundation phase establishes the canonical artifacts, tooling, and governance scaffolding required for a credible v0.1-draft release. No external validation is attempted in this window; the goal is a self-consistent, publishable package.

### 1.1 Finalize SPEC.md v0.1-draft with all stable requirement IDs

- **Owner:** DREP1
- **Dependency:** None (entry task)
- **Acceptance criteria:**
  - Every normative requirement has a unique, stable ID of the form `REQ-XXX`.
  - Requirement IDs are referenced consistently from conformance classes, test vectors, and the metric registry.
  - No requirement ID is reused or renumbered after publication (freeze enforced).
  - SPEC.md passes internal linting (markdown structure, heading hierarchy, requirement-ID format).
- **Status:** pending

### 1.2 Publish canonical telemetry envelope schema

- **Owner:** DREP1
- **Dependency:** 1.1 (requirement IDs must exist before schema references them)
- **Acceptance criteria:**
  - Schema published in JSON Schema 2020-12 format under `/schema/envelope.json`.
  - Schema covers: protocol version, provider, model, request context, metric block, privacy mode, signature.
  - A round-trip validator script (`tools/validate-envelope.py`) accepts all 5 example payloads and rejects 5 negative test cases.
  - Schema version field set to `0.1.0`.
- **Status:** pending

### 1.3 Publish metric registry with 5 metrics

- **Owner:** DREP1
- **Dependency:** 1.1
- **Acceptance criteria:**
  - Registry file `/registry/metrics.yaml` defines exactly 5 metrics: `log_leverage` (alias `10xDEV`), `output_fraction` (alias `SNR`), `Upsilon`, `compression_ratio`, `cost_per_output_token`.
  - Each metric entry includes: canonical name, aliases, unit, formula, value domain, normative reference (REQ-ID), and stability flag.
  - Registry is machine-parseable and consumed by the conformance runner.
- **Status:** pending

### 1.4 Publish 5 example payloads + test vectors

- **Owner:** DREP2
- **Dependency:** 1.2, 1.3
- **Acceptance criteria:**
  - 5 JSON example payloads under `/examples/` covering: minimal, full-envelope, privacy-redacted, multi-turn, and error-case.
  - A `test-vectors.json` file pairs each example with expected metric values computed to 4 decimal places.
  - Vectors are consumed by the conformance runner as golden tests.
- **Status:** pending

### 1.5 Upgrade conformance runner to support 6 conformance classes

- **Owner:** DREP2
- **Dependency:** 1.1, 1.3, 1.4
- **Acceptance criteria:**
  - Runner (`tools/conformance-runner.py`) supports 6 classes: C1-Core-Envelope, C2-Metric-Computation, C3-Privacy-Modes, C4-Provider-Adapter, C5-Signature, C6-Interoperability.
  - Each class has a defined pass/fail threshold documented in `/conformance/classes.md`.
  - Runner emits a machine-readable JSON report and a human-readable Markdown summary.
  - Runner exits non-zero on any class failure.
- **Status:** pending

### 1.6 Write provider adapters for Anthropic, OpenAI, Google

- **Owner:** DREP2
- **Dependency:** 1.2, 1.3
- **Acceptance criteria:**
  - Three adapter modules under `/adapters/`: `anthropic.py`, `openai.py`, `google.py`.
  - Each adapter normalizes provider-native usage data into the canonical envelope.
  - Each adapter passes C4-Provider-Adapter conformance class.
  - Adapters are documented with provider-specific caveats (e.g., cached-token handling for Anthropic, reasoning-token handling for OpenAI).
- **Status:** pending

### 1.7 Define 3 privacy modes with full specifications

- **Owner:** DREP1
- **Dependency:** 1.1
- **Acceptance criteria:**
  - Three modes specified: `open` (full payload), `redacted` (prompt/response stripped, metrics retained), `aggregate` (only aggregate metrics, no per-request data).
  - Each mode has a normative REQ-ID and a testable invariant.
  - Privacy mode is a required envelope field; absence is a conformance failure.
- **Status:** pending

### 1.8 Set up public GitHub repository with issue tracker

- **Owner:** DREP1
- **Dependency:** None
- **Acceptance criteria:**
  - Repository is public with README, LICENSE (Apache-2.0 proposed), and branch protection on `main`.
  - Issue templates for: bug report, conformance failure, spec clarification, new metric proposal.
  - GitHub Actions CI runs markdown lint + conformance runner on every PR.
- **Status:** pending

### 1.9 Publish governance document and OEP template

- **Owner:** DREP1
- **Dependency:** 1.8
- **Acceptance criteria:**
  - `GOVERNANCE.md` defines: DREP roles, decision tiers, feedback windows, OEP process.
  - `OEP-0000-template.md` provides a skeleton for future OEPs.
  - Governance document references the 60-day feedback window for v0.1.
- **Status:** pending

### 1.10 Create CONTRIBUTING.md and CODE_OF_CONDUCT.md

- **Owner:** Community
- **Dependency:** 1.8, 1.9
- **Acceptance criteria:**
  - `CONTRIBUTING.md` covers: local setup, PR process, conformance requirements, DCO sign-off (pending decision UD-7).
  - `CODE_OF_CONDUCT.md` adopts Contributor Covenant 2.1 with reporting contact.
  - Both files linked from README.
- **Status:** pending

---

## Phase 2: Days 31–60 (Validation)

The Validation phase exercises the v0.1-draft package against at least one real implementation, gathers feedback, and produces interoperability evidence. The 60-day feedback window (opened at v0.1 publication) closes during this phase.

### 2.1 Run conformance suite against SignalAF (Implementation #1)

- **Owner:** DREP2
- **Dependency:** 1.5, 1.6 (runner + adapters)
- **Acceptance criteria:**
  - SignalAF passes C1, C2, C3 conformance classes at minimum.
  - Any failures are filed as issues with reproduction steps.
  - Conformance report published under `/reports/signalaf-v0.1.md`.
- **Status:** pending

### 2.2 Recruit Implementation #2 candidate (target: IDE plugin or observability platform)

- **Owner:** DREP1
- **Dependency:** 1.8 (public repo must exist)
- **Acceptance criteria:**
  - At least one external team has committed in writing to a v0.1 pilot.
  - Target candidate identified from IDE-plugin or observability-platform space.
  - Memorandum of understanding or equivalent recorded (not necessarily public).
- **Status:** pending

### 2.3 Incorporate v0.1 feedback from 60-day feedback window

- **Owner:** DREP1
- **Dependency:** 1.9 (governance defines the window), elapsed 60 days
- **Acceptance criteria:**
  - All feedback issues triaged and labeled: `accepted`, `deferred-to-v0.5`, or `wontfix`.
  - A feedback-disposition document published summarizing each issue and its resolution.
  - Accepted changes batched into a v0.1.1 patch or deferred to v0.5 per severity.
- **Status:** pending

### 2.4 Write OpenTelemetry semantic mapping draft

- **Owner:** Community
- **Dependency:** 1.3 (metric registry)
- **Acceptance criteria:**
  - Draft document `docs/otel-mapping.md` maps each of the 5 metrics to OTel semantic-convention attributes.
  - Mapping covers: metric name, unit, instrument type (gauge/histogram/counter), and attribute set.
  - Draft is labeled non-normative and targeted for v0.5.
- **Status:** pending

### 2.5 Create explainer assets (blog post, one-page summary, demo)

- **Owner:** Community
- **Dependency:** 1.1, 1.4
- **Acceptance criteria:**
  - Blog post (1,500–2,500 words) explaining OTEP's problem space and v0.1 scope.
  - One-page summary PDF suitable for conference distribution.
  - Recorded demo (≤10 min) showing conformance runner against SignalAF.
- **Status:** pending

### 2.6 Define adapter registry format and register initial 3 adapters

- **Owner:** DREP2
- **Dependency:** 1.6
- **Acceptance criteria:**
  - `registry/adapters.yaml` defines a stable format: provider name, adapter path, conformance class, version, maintainer.
  - Initial 3 adapters (Anthropic, OpenAI, Google) registered.
  - Registry is consumed by the conformance runner for C4 validation.
- **Status:** pending

### 2.7 Test cross-provider interoperability (Anthropic vs OpenAI vs Google)

- **Owner:** DREP2
- **Dependency:** 1.6, 2.6
- **Acceptance criteria:**
  - A shared prompt set is run through all 3 adapters.
  - Canonical envelopes are compared: metric values within documented tolerance.
  - Discrepancies catalogued with root-cause analysis (e.g., tokenization differences).
  - Report published under `/reports/interop-v0.1.md`.
- **Status:** pending

### 2.8 Publish implementation-experience report for Implementation #1

- **Owner:** DREP1
- **Dependency:** 2.1
- **Acceptance criteria:**
  - Report covers: integration effort (person-hours), friction points, spec ambiguities discovered, and recommended v0.5 changes.
  - Report is published as an OEP or appendix to the spec repo.
  - SignalAF team reviews and sign-offs the report.
- **Status:** pending

---

## Phase 3: Days 61–90 (Expansion)

The Expansion phase pivots from v0.1 stabilization toward v0.5 planning, community growth, and foundation-readiness groundwork. No normative v0.1 changes are made in this window except patch-level fixes.

### 3.1 Begin v0.5 planning (provider normalization, signatures, OTel mapping)

- **Owner:** DREP1
- **Dependency:** 2.3, 2.4, 2.8
- **Acceptance criteria:**
  - v0.5 scope document drafted listing candidate features: provider normalization layer, cryptographic signatures, OTel semantic mapping promotion.
  - Each candidate feature has a feasibility note and rough effort estimate.
  - Document circulated to working group for comment.
- **Status:** pending

### 3.2 Publish first OEP (protocol name finalization)

- **Owner:** DREP1
- **Dependency:** Decision UD-1 (protocol name) approved
- **Acceptance criteria:**
  - OEP-0001 submitted using the OEP template.
  - OEP records the final protocol name, trademark status, and rationale.
  - OEP is merged following the governance-defined OEP process (discussion → review → merge).
- **Status:** pending

### 3.3 Establish security reporting process

- **Owner:** DREP1
- **Dependency:** Decision UD-8 (security contact) resolved
- **Acceptance criteria:**
  - `SECURITY.md` published with reporting address, PGP key, and disclosure timeline (target: 90-day coordinated disclosure).
  - Security contact is monitored and acknowledged within 48 hours (SLA documented).
  - Process reviewed by at least one external security advisor.
- **Status:** pending

### 3.4 Run first public conformance test day

- **Owner:** Community
- **Dependency:** 1.5, 2.1
- **Acceptance criteria:**
  - A scheduled, public test day is announced ≥2 weeks in advance.
  - At least 3 teams participate (SignalAF + 2 others).
  - Results published within 1 week of the event.
  - Retrospective notes captured for improving future test days.
- **Status:** pending

### 3.5 Publish adoption KPIs dashboard

- **Owner:** DREP2
- **Dependency:** 2.1, 2.2, 3.4
- **Acceptance criteria:**
  - Dashboard tracks: number of conformant implementations, conformance-class coverage, adapter count, GitHub stars/issues, OEP count.
  - Dashboard is auto-updated from repository metadata (GitHub Actions + generated JSON).
  - Dashboard is linked from the README.
- **Status:** pending

### 3.6 Begin foundation-readiness assessment

- **Owner:** DREP1
- **Dependency:** 2.1, 2.2 (need ≥2 implementations as a prerequisite signal)
- **Acceptance criteria:**
  - Assessment document evaluates candidate foundations (e.g., Linux Foundation, Eclipse Foundation, OW2).
  - Criteria include: governance fit, IP policy, trademark handling, cost.
  - Recommendation drafted but not actioned (action requires v1.0 per UD-6).
- **Status:** pending

### 3.7 Draft trademark usage guidelines

- **Owner:** DREP1
- **Dependency:** Decision UD-9 (trademark registration) resolved
- **Acceptance criteria:**
  - Guidelines define: permitted uses of the protocol name, certification-badge rules (if any), and derivative-work naming.
  - Guidelines reviewed by legal counsel.
  - Guidelines published as `TRADEMARK.md`.
- **Status:** pending

### 3.8 Plan v0.5 scope and timeline

- **Owner:** DREP1
- **Dependency:** 3.1
- **Acceptance criteria:**
  - v0.5 scope frozen and documented with a target release date.
  - Work items broken into 2-week increments.
  - Resource needs (maintainer hours, infrastructure) estimated.
  - Plan reviewed and approved by DREP1 + DREP2.
- **Status:** pending

---

## Summary

| Phase | Items | Target completion |
|-------|-------|-------------------|
| Days 1–30 (Foundation) | 10 | Self-consistent, publishable v0.1-draft package |
| Days 31–60 (Validation) | 8 | One conformant implementation + interoperability evidence |
| Days 61–90 (Expansion) | 8 | v0.5 planning + community scaffolding + foundation groundwork |

**Cross-cutting dependencies:** Decisions UD-1, UD-7, and UD-8 (see `UNRESOLVED-DECISIONS.md`) block items 3.2, 1.10/2.3, and 3.3 respectively. These should be resolved within the first 30 days to avoid schedule slip.

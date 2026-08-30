# OTEP Integration and Adoption Plan

**Protocol:** OTEP (Operator Token Efficiency Protocol)
**Current version:** `otep/0.1-draft`
**Document status:** Living document — updated as integrations land
**Companion to:** `ADOPTION-ROADMAP.md`

---

## 1. Purpose

This plan prioritizes OTEP integrations by **dependency** (what unblocks other integrations) and **distribution value** (how much an integration expands the protocol's reach). It defines, for each integration class, the minimal technical contract a partner must satisfy, the incentive for the partner, the effort estimate, and the acceptance criteria.

Integrations are ranked P1 through P8. P1 is the highest priority because it is the primary production path — without producers emitting OTEP records, every downstream integration is theoretical.

**What this plan is not:** a commitment to ship every integration by a fixed date, nor a promise that every listed partner will adopt OTEP. Each integration is independent and optional. The plan exists so that when a partner is ready, the contract is already defined.

---

## 2. Priority Order and Rationale

| Priority | Integration class | Why this rank |
|----------|-------------------|---------------|
| P1 | AI coding tool and CLI collectors | Primary producers. Without records, nothing downstream works. |
| P2 | GitHub/GitLab workflow metadata | Automated collection path. Enables CI/CD-native emission without per-tool adapters. |
| P3 | CSV, JSON, API, and warehouse export | Enterprise analytics floor. Unblocks data teams who cannot run live consumers. |
| P4 | OpenTelemetry semantic mapping | Standards alignment. Makes OTEP consumable by the existing OTel ecosystem. |
| P5 | Observability systems | Consumer-side validation. Proves the envelope is ingestible by real platforms. |
| P6 | Engineering-intelligence platforms | Enterprise distribution. Extends reach into org-level analytics. |
| P7 | IDE marketplaces | Distribution surface. Lowers friction for individual developers. |
| P8 | Research and education systems | Long-tail adoption. Builds the next generation of practitioners. |

The ordering reflects a deliberate producer-first strategy: P1–P3 create and move records, P4–P6 make records consumable by existing infrastructure, and P7–P8 expand the population of people who can emit and read them.

---

## 3. P1 — AI Coding Tool and CLI Collectors

**Examples:** Claude Code, Cursor, Copilot, Windsurf, and similar tools that expose per-session token usage.

### 3.1 Value proposition

These tools are where operators actually spend tokens. An OTEP adapter in a coding tool gives the operator a portable record of their session without requiring a separate instrumentation step. For the tool vendor, emitting OTEP means their users can export usage data into any OTEP-compatible consumer — leaderboard, observability platform, or warehouse — without the vendor building each integration itself.

### 3.2 Minimal technical contract

- Emit one OTEP record per session (or per observation window) with `input`, `output`, `cache_write`, `cache_read` as non-negative integers
- Populate `provider` and `provider_model` fields
- Set `provenance_level` to at least `1` (self-reported) or higher if the tool has access to provider-native usage metadata
- Validate against the published JSON Schema before emission
- Do not fabricate missing telemetry — use null semantics per SPEC §13

### 3.3 Partner incentive

- Neutral export format reduces vendor-specific integration requests
- Users can compare their efficiency across tools using a shared vocabulary
- No requirement to expose internal product logic — only the four primitives

### 3.4 Implementation effort

**Medium.** Token usage is already tracked internally; the work is mapping internal counters onto I/O/W/R and emitting a validated envelope.

### 3.5 Dependencies

- Provider normalization rules (v0.5) for accurate I/O/W/R mapping
- Published schema URL for validation

### 3.6 Acceptance criteria

- Adapter emits records that pass the conformance runner
- At least one session record published as a test vector or example
- Documentation describing how the adapter maps native usage fields to OTEP primitives

### 3.7 Conformance class

`SigRank Compatible — v0.1-draft` (producer class)

### 3.8 Launch artifact

Reference adapter in `integrations/cli/` (sigrank-mcp) plus a per-tool integration guide published with the v0.1 launch.

---

## 4. P2 — GitHub/GitLab Workflow Metadata

### 4.1 Value proposition

CI/CD workflows already run AI steps (code review bots, test generation, doc summarization). Attaching OTEP metadata to workflow runs makes token efficiency an observable property of the pipeline, not just of individual sessions. Teams can track efficiency alongside build time and test coverage.

### 4.2 Minimal technical contract

- Emit an OTEP record as a workflow artifact (JSON file) or as a step output
- Include `workflow_run_id`, `repository`, and `commit_sha` in the extension fields
- Link the record to the AI step that produced it
- Validate against the schema before publishing the artifact

### 4.3 Partner incentive

- Token cost becomes a first-class CI metric alongside time and pass rate
- Enables org-level efficiency tracking without per-developer instrumentation
- Works with existing workflow artifact retention policies

### 4.4 Implementation effort

**Low.** A workflow step that wraps an AI call and emits a JSON artifact requires no platform changes.

### 4.5 Dependencies

- P1 adapters or a CLI collector that can run inside a workflow step
- Workflow artifact storage (native to both GitHub and GitLab)

### 4.6 Acceptance criteria

- A reusable workflow action or template published in the repo
- Example workflow run producing a valid OTEP artifact
- Documentation on artifact naming and retention

### 4.7 Conformance class

`SigRank Compatible — v0.1-draft` (producer class, CI/CD profile)

### 4.8 Launch artifact

GitHub Action and GitLab CI template in `integrations/` published at v0.5 (when normalization rules are stable enough for CI use).

---

## 5. P3 — CSV, JSON, API, and Warehouse Export

### 5.1 Value proposition

Most enterprise data teams do not run live observability consumers. They want a file or an API endpoint they can load into Snowflake, BigQuery, or a notebook. A standard export format means a data team can analyze OTEP records from any producer without custom parsing per tool.

### 5.2 Minimal technical contract

- Export OTEP records as newline-delimited JSON (NDJSON) for streaming loads
- Provide a CSV projection for the flat fields (primitives, derived metrics, provider, timestamp)
- Provide a REST or GraphQL API endpoint returning OTEP records with pagination
- Include schema version in every export so consumers can detect format changes
- Preserve null semantics — do not coerce null to zero in CSV exports

### 5.3 Partner incentive

- Analysts can query OTEP data in their existing warehouse without a new pipeline
- Standard format eliminates per-tool parsing logic
- Enables cross-tool efficiency benchmarking inside an organization

### 5.4 Implementation effort

**Low–Medium.** NDJSON and CSV export are straightforward; the API endpoint depends on existing infrastructure.

### 5.5 Dependencies

- P1 producers generating records to export
- Schema stability sufficient for warehouse column definitions (target v0.5)

### 5.6 Acceptance criteria

- NDJSON export passes schema validation on every line
- CSV export documented with a column manifest
- API endpoint returns paginated, versioned records
- Example warehouse load script published

### 5.7 Conformance class

`SigRank Compatible — v0.1-draft` (exporter class)

### 5.8 Launch artifact

Export specification and reference NDJSON/CSV examples in `integrations/` published at v0.5.

---

## 6. P4 — OpenTelemetry Semantic Mapping

### 6.1 Value proposition

OpenTelemetry is the dominant observability standard. Mapping OTEP primitives and metrics to OTel semantic conventions means any OTel-compatible backend can ingest OTEP data without a custom collector. This is the single highest-leverage standards alignment in the roadmap.

### 6.2 Minimal technical contract

- Define OTEP attributes as OTel semantic-convention attributes (e.g., `otep.input_tokens`, `otep.output_tokens`, `otep.cache_write_tokens`, `otep.cache_read_tokens`)
- Map derived metrics as OTel gauge or histogram metrics
- Provide an OTel collector processor or exporter that translates OTEP envelopes to OTel spans/metrics
- Pin the mapping to a dated OTel semantic-conventions release

### 6.3 Partner incentive

- OTel ecosystem gains AI-operator measurement semantics without inventing them
- OTEP gains access to every OTel-compatible backend (Jaeger, Tempo, Prometheus, Datadog, Honeycomb, etc.)
- Reduces friction for observability teams already invested in OTel

### 6.4 Implementation effort

**Medium–High.** Semantic-convention alignment requires coordination with the OTel community; the collector component is moderate engineering work.

### 6.5 Dependencies

- v0.5 provider normalization rules (so the mapping is stable)
- OTel semantic-conventions repository alignment
- A collector component maintainer

### 6.6 Acceptance criteria

- Mapping document published and pinned to a dated OTel release
- Collector processor or exporter passes round-trip tests (OTEP → OTel → OTEP preserves primitives)
- At least one OTel backend ingests mapped OTEP data successfully

### 6.7 Conformance class

`SigRank Compatible — v0.1-draft` (mapping class); targets OTel contrib conformance

### 6.8 Launch artifact

OTel mapping guide and collector component published at v0.5 (per `ADOPTION-ROADMAP.md` §5.1).

---

## 7. P5 — Observability Systems (Langfuse, Helicone, etc.)

### 7.1 Value proposition

Observability platforms already ingest LLM telemetry. Accepting OTEP records as a native input format means these platforms can consume data from any OTEP-compatible producer without per-producer adapters. For the platform, this expands the universe of ingestible sources; for the producer, it means one export format works across platforms.

### 7.2 Minimal technical contract

- Accept OTEP NDJSON or API input
- Validate incoming records against the published schema
- Preserve null semantics — display null distinctly from zero
- Compute derived metrics using the published formulas (or accept pre-computed values with a flag)
- Expose OTEP primitives and metrics in the platform's query and dashboard surfaces

### 7.3 Partner incentive

- Ingestion of any OTEP-compatible producer without custom adapters
- Differentiation as an OTEP-native consumer
- Access to a growing producer ecosystem without per-tool business development

### 7.4 Implementation effort

**Medium.** Schema validation and ingestion are standard; the work is surfacing OTEP metrics in existing dashboard and query UIs.

### 7.5 Dependencies

- P1 producers generating records
- P3 export format for ingestion testing
- Stable metric definitions (target v0.9 for production-grade consumption)

### 7.6 Acceptance criteria

- Platform ingests OTEP NDJSON and validates against the schema
- Platform displays I/O/W/R and at least two derived metrics
- Null values displayed distinctly from zero
- At least one dashboard template published

### 7.7 Conformance class

`SigRank Compatible — v0.1-draft` (consumer class)

### 7.8 Launch artifact

Ingestion guide and dashboard template published at v0.9 (when metric definitions are frozen).

---

## 8. P6 — Engineering-Intelligence Platforms

### 8.1 Value proposition

Engineering-intelligence platforms aggregate developer productivity and system metrics at the organization level. OTEP gives these platforms a neutral token-efficiency signal that complements their existing DORA, SPACE, and commit-based metrics — without conflating token efficiency with developer productivity (per SPEC §25, prohibited interpretations).

### 8.2 Minimal technical contract

- Ingest OTEP records via the P3 export format or API
- Aggregate records at the team, repository, or workflow level — never at the individual-operator level for personnel evaluation (privacy requirement)
- Present OTEP metrics alongside existing engineering metrics with clear labeling that token efficiency is not a productivity measure
- Respect the three privacy modes defined in SPEC §17

### 8.3 Partner incentive

- Adds a new dimension to engineering intelligence without inventing the measurement
- Neutral format avoids vendor lock-in on the measurement layer
- Privacy-by-design (metadata-only, no prompt content) reduces legal review burden

### 8.4 Implementation effort

**Medium.** Ingestion is standard; the work is the aggregation model and the careful labeling required to avoid productivity conflation.

### 8.5 Dependencies

- P2 workflow metadata for org-level aggregation
- P3 export format for bulk ingestion
- Stable metric definitions (v0.9)
- Privacy mode enforcement (v0.5)

### 8.6 Acceptance criteria

- Platform ingests OTEP records and aggregates at team/repository/workflow level
- No individual-operator efficiency scores exposed for personnel evaluation
- OTEP metrics labeled as token-processing efficiency, not productivity
- Privacy mode respected in aggregation (redacted records not deanonymized)

### 8.7 Conformance class

`SigRank Compatible — v0.1-draft` (consumer class, enterprise profile)

### 8.8 Launch artifact

Enterprise integration guide published at v0.9 or v1.0, depending on platform partner readiness.

---

## 9. P7 — IDE Marketplaces (VS Code, JetBrains)

### 9.1 Value proposition

Most AI-assisted development happens inside an IDE. A marketplace extension that emits OTEP records lowers the barrier for individual developers to measure their own token efficiency without a separate CLI or workflow setup. For the protocol, IDE distribution is the highest-friction-reduction surface for individual adoption.

### 9.2 Minimal technical contract

- Extension wraps the IDE's AI features and emits OTEP records per session or per observation window
- Records validate against the published schema
- Extension stores records locally and offers export (NDJSON/CSV) — no mandatory cloud upload
- Privacy mode selectable by the user (SPEC §17)
- No telemetry about prompt or completion content — only token counts

### 9.3 Partner incentive

- Extension authors gain a neutral measurement feature without building a backend
- Users get a portable efficiency record they own and can take to any consumer
- Marketplace listing differentiates on measurement transparency

### 9.4 Implementation effort

**Medium.** IDE extension APIs are well-documented; the work is wrapping AI feature usage and emitting validated records without degrading editor performance.

### 9.5 Dependencies

- P1 adapter patterns for usage-field mapping
- Schema validation available in a browser/extension runtime (JSON Schema validator in WASM or JS)

### 9.6 Acceptance criteria

- Extension published on VS Code Marketplace and/or JetBrains Marketplace
- Extension emits validated OTEP records for at least one AI feature
- Local export to NDJSON and CSV working
- Privacy mode enforced and user-selectable
- No measurable editor performance degradation in normal use

### 9.7 Conformance class

`SigRank Compatible — v0.1-draft` (producer class, IDE profile)

### 9.8 Launch artifact

Reference VS Code extension in `integrations/` published at v0.9; JetBrains extension follows based on partner interest.

---

## 10. P8 — Research and Education Systems

### 10.1 Value proposition

Academic researchers studying AI-assisted development need a shared measurement vocabulary to make studies comparable. OTEP provides a ready-made, content-independent metric set that respects subject privacy — critical for IRB-approved studies. For educators, OTEP gives students a concrete way to measure and reflect on their own AI tool usage.

### 10.2 Minimal technical contract

- Use OTEP records as a data source in research studies, citing the spec version
- For education tools, emit OTEP records that students can inspect and export
- Respect privacy modes — research studies must use at least privacy mode 2 (redacted) unless IRB approval covers mode 1
- Publish replication packages that include the OTEP schema version used

### 10.3 Partner incentive

- Researchers gain a citable, versioned measurement protocol instead of ad-hoc metrics
- Educators gain a teaching tool for AI literacy without building measurement infrastructure
- Content independence simplifies IRB review

### 10.4 Implementation effort

**Low.** Research use is primarily citation and data collection; education use is a thin wrapper over P1 or P7 adapters.

### 10.5 Dependencies

- Stable spec version for citation (v0.1 acceptable for pilot studies; v1.0 for publication)
- P1 or P7 adapters for data collection
- Privacy mode documentation suitable for IRB submission

### 10.6 Acceptance criteria

- At least one research study or course using OTEP published with a replication package
- OTEP cited with the correct version string in the study
- Privacy mode documented in the IRB submission materials

### 10.7 Conformance class

`SigRank Compatible — v0.1-draft` (research/education profile — conformance is citation and privacy-mode compliance, not suite passage)

### 10.8 Launch artifact

Researcher's guide to OTEP (citation template, privacy-mode IRB language) published at v0.5; course materials published as adoption grows.

---

## 11. Cross-Cutting Acceptance Criteria

Every integration, regardless of priority, must satisfy these cross-cutting criteria:

1. **Schema validation.** Emitted or ingested records validate against the published JSON Schema for the declared version.
2. **Null semantics.** Null, zero, unsupported, and invalid values are handled per SPEC §13. No coercion of null to zero.
3. **Version string.** Every record carries the spec version string (`otep/0.1-draft` or successor).
4. **Privacy modes.** Integrations that handle records respect the three privacy modes defined in SPEC §17.
5. **No content telemetry.** No integration emits or logs prompt or completion text as part of an OTEP record.
6. **Provenance honesty.** `provenance_level` reflects the actual source of the data, not an aspirational source.

---

## 12. Integration Timeline

| Integration | Earliest stage | Rationale |
|-------------|----------------|-----------|
| P1 CLI collectors | v0.1 | Reference adapter ships with the launch |
| P2 Workflow metadata | v0.5 | Needs stable normalization for CI use |
| P3 Export formats | v0.5 | Needs schema stability for warehouse columns |
| P4 OTel mapping | v0.5 | Per roadmap §5.1 |
| P5 Observability systems | v0.9 | Needs frozen metric definitions for production ingestion |
| P6 Engineering-intelligence | v0.9–v1.0 | Needs frozen definitions and privacy enforcement |
| P7 IDE marketplaces | v0.9 | Needs stable adapter patterns |
| P8 Research and education | v0.5 (pilot), v1.0 (publication) | Pilot studies can use draft; publication needs stable version |

---

## 13. Partner Engagement Model

Partners are not asked to commit before the spec is useful. The engagement model is:

1. **Observe (v0.1).** Any party can read the spec, run the conformance runner, and form an opinion. No commitment required.
2. **Attempt (v0.5).** A party tries to emit or consume OTEP records and reports back via GitHub Issues. Failure reports are as valuable as success reports.
3. **Implement (v0.9).** A party ships an integration that passes the conformance suite and publishes results.
4. **Maintain (v1.0+).** A party maintains its integration across spec versions and participates in governance.

No stage requires exclusivity. A partner may engage at any level and withdraw at any time.

---

## 14. Change Log

| Date | Change |
|------|--------|
| 2026-08-28 | Initial integration and adoption plan drafted alongside v0.1-draft spec |

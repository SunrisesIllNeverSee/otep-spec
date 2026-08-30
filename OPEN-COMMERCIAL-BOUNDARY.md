# OTEP Open / Commercial Boundary

**Status:** Draft
**Last updated:** 2025
**Owner:** OTEP Steering Group

## Purpose

This document defines explicitly which parts of the OTEP ecosystem are open
and which are commercial. The open standard is **OTEP** (Operator Token
Efficiency Protocol). The commercial product is **SignalAF**. The boundary
between them must be unambiguous so that:

- Adopters can implement OTEP independently, from the published specification
  alone, without depending on any commercial product.
- The commercial product can differentiate and add value without secretly
  altering the meaning of open metrics.
- Conformance is verifiable against open artifacts, not against proprietary
  behavior.

Anything that affects the *meaning* of a protocol-conformant metric belongs
on the open side. Anything that affects *ranking, eligibility, or product
experience* may belong on the commercial side, provided it does not silently
redefine open computations.

## Boundary matrix

| Component | Open or commercial | Rationale | Public interface | Independent reproducibility | Conformance implications | Review cadence |
|---|---|---|---|---|---|---|
| Telemetry envelope schema | Open | The envelope is the protocol's core data structure. It must be implementable by anyone without reference to proprietary code. | JSON Schema in the OTEP repository; versioned in OTEPs. | Yes — any implementer can produce and validate envelopes from the published schema. | Envelope structure is part of the conformance suite. | Per OTEP revision cycle. |
| Metric definitions (Yield, Leverage, Velocity, output_fraction, log_leverage) | Open | These are the protocol's core metrics. Their formulas, units, and edge-case handling must be fully specified so that independent implementations produce identical results. | Formulas and normative text in SPEC.md; machine-readable definitions in the schema repository. | Yes — calculations must be reproducible from the specification alone. | Metric computation is tested by the conformance runner with published test vectors. | Per OTEP revision cycle; metric changes require a new OTEP. |
| Provider adapters (Anthropic, OpenAI, Google) | Open | Adapters normalize provider-specific telemetry into the OTEP envelope. Keeping them open ensures any implementer can ingest from supported providers without reverse engineering. | Reference adapter source under Apache 2.0; documented mapping tables. | Yes — an implementer can write a conformant adapter from the mapping spec, or use the reference adapter directly. | Adapter output is validated against the envelope schema; adapters are not themselves certified, only their output. | Per provider API change or OTEP revision. |
| Conformance runner | Open | The runner is the arbiter of conformance. If it were proprietary, no independent party could verify conformance claims. | Source under Apache 2.0; CLI documented in the repository. | Yes — any party can run the runner against their implementation. | The runner defines the conformance test surface. | Per OTEP revision; continuous integration on every commit. |
| Test vectors | Open | Test vectors fix the expected inputs and outputs for metric computation. They are the ground truth for conformance. | JSON/YAML files in the repository, versioned with each OTEP release. | Yes — vectors are self-contained and do not depend on external services. | A conformant implementation must produce results matching the published vectors within documented tolerances. | Per OTEP revision; new vectors added when metrics change or edge cases are identified. |
| Privacy modes | Open | Privacy modes (e.g., redaction, aggregation, cohort-only disclosure) are protocol-level controls that affect what telemetry is emitted. They must be specified openly so adopters can reason about data exposure. | Normative text in SPEC.md; schema fields for privacy flags. | Yes — an implementer can support privacy modes from the specification. | Privacy mode behavior is part of the conformance suite. | Per OTEP revision. |
| 10xDEV application profile | Open (optional profile) | The 10xDEV profile is an optional application-level profile built on OTEP metrics. It is published openly so any platform can implement it, but implementations are not required to support it for base conformance. | Profile document in the repository; references open metric definitions. | Yes — the profile is defined in terms of open metrics and can be reproduced independently. | Implementing 10xDEV is optional; conformance to the profile is a separate, higher tier. | Per OTEP revision or per profile revision. |
| Hosted leaderboard | Commercial (SignalAF) | A hosted leaderboard is a product feature, not a protocol feature. It depends on proprietary ranking logic, cohort management, and operational infrastructure. | Public-facing web UI; no protocol-level interface. | No — the leaderboard cannot be reproduced from the specification because it depends on commercial ranking and eligibility logic. | None — leaderboard ranking is not a conformance concern. | Continuous (SignalAF product cycle). |
| Private cohorts | Commercial | Cohort membership, grouping logic, and access controls are product features. The protocol defines how cohort-scoped telemetry is represented, but not who is in which cohort. | API exposed by SignalAF; not part of OTEP. | No — cohort composition is managed by the commercial product. | None — cohort membership is not tested by the conformance suite. | Continuous (SignalAF product cycle). |
| Eligibility thresholds | Commercial | Thresholds for leaderboard inclusion, tier qualification, or feature gating are product decisions. The protocol defines how metrics are computed, not which metric values qualify for what. | SignalAF configuration; not part of OTEP. | No — thresholds are set by the commercial product and may change without a protocol revision. | None — thresholds are not part of conformance. | Continuous (SignalAF product cycle). |
| Anti-gaming / abuse signals | Commercial | Abuse detection relies on proprietary signals and models that must remain confidential to be effective. Disclosing them would undermine their purpose. | No public interface; internal to SignalAF. | No — abuse signals cannot be reproduced from the specification. | None directly; see the section on closed behavior and metric meaning below. | Continuous (SignalAF product cycle). |
| Anomaly models | Commercial | Anomaly detection models are trained on proprietary data and tuned for the commercial product. They are not part of the protocol. | No public interface; internal to SignalAF. | No — models cannot be reproduced from the specification. | None — anomaly detection is not a conformance concern. | Continuous (SignalAF product cycle). |
| Enterprise SSO / audit / SLA | Commercial | Enterprise features (single sign-on, audit logging, service-level agreements) are operational product capabilities layered on top of OTEP conformance. | SignalAF product interfaces; not part of OTEP. | No — these are service offerings, not protocol features. | None — enterprise features are orthogonal to conformance. | Continuous (SignalAF product cycle). |
| Build Archetypes | Commercial (SignalAF reference extension) | Build Archetypes are a SignalAF-specific extension that maps OTEP metrics onto development workflow patterns. They are published as a reference extension, not as part of the core protocol. | SignalAF documentation; may reference open metrics. | Partially — the archetype definitions may be published, but the full value comes from SignalAF tooling. | None — archetypes are not required for OTEP conformance. | Per SignalAF release. |
| RS05 class tiers | Commercial (SignalAF reference extension) | RS05 class tiers are a SignalAF-specific classification scheme built on OTEP metrics. They extend the protocol but are not part of it. | SignalAF documentation; references open metrics. | Partially — the tier definitions may be published, but classification logic is commercial. | None — RS05 tiers are not required for OTEP conformance. | Per SignalAF release. |
| Managed conformance services | Commercial (but based on open tests) | SignalAF may offer managed conformance testing as a service. The underlying tests are open; the managed delivery, reporting, and certification workflow are commercial. | SignalAF service interface; runs the open conformance runner. | Yes for the tests; no for the managed delivery layer. | A managed conformance service must use the open conformance runner and test vectors; it may add reporting but must not alter the test logic. | Continuous (SignalAF product cycle); tests track OTEP revisions. |

## How to determine where a new component belongs

When a new component is proposed, the following decision procedure determines
whether it belongs on the open side or the commercial side:

1. **Does it affect how a protocol-conformant metric is computed?** If yes,
   it belongs on the open side and must be specified in an OTEP. This is true
   even if the component is initially built for SignalAF — if it changes a
   metric's value, it must be open.

2. **Does it define a data structure, field, or flag that an independent
   implementer must emit or consume to interoperate?** If yes, it belongs on
   the open side. Interoperability requires that all parties share the same
   definition.

3. **Does it affect ranking, eligibility, presentation, or operational
   experience without changing metric computation?** If yes, it may belong on
   the commercial side, provided it does not silently redefine open
   computations (see the binding constraint below).

4. **Is it a service offering (hosting, SSO, SLA, managed testing)?** If yes,
   it belongs on the commercial side. Services are not protocol artifacts.

5. **Is it unclear?** When in doubt, default to open. The cost of
   over-opening a component is low (the commercial product can still build on
   top of it). The cost of under-opening a component is high (it creates a
   hidden dependency that undermines independent implementation).

## Relationship to the licensing decision matrix

The open/commercial boundary and the licensing decision matrix
(`LICENSING-DECISION-MATRIX.md`) are complementary documents:

- This document defines *what* is open and *what* is commercial.
- The licensing matrix defines *under what terms* the open artifacts are
  published.

Open artifacts are published under the licenses recommended in the licensing
matrix (CC BY 4.0 for specification text, schemas, and documentation;
Apache 2.0 for reference code and conformance tests). Commercial artifacts
are governed by SignalAF's proprietary licensing and are not covered by the
open licenses.

A component cannot be "partially open." If any element of a component affects
metric computation or interoperability, the entire computational definition
must be open. The commercial product may build additional layers on top of an
open definition, but the open definition must stand alone.

## Closed behavior cannot secretly change open metric meaning

This is a binding design constraint on the commercial product, not a
guideline. It exists to preserve the integrity of the open standard: if a
commercial product could silently redefine what a metric means, the standard
would be a marketing document rather than a specification.

### 1. Private controls affect eligibility, not computation

Private anti-gaming controls, anomaly models, and eligibility thresholds MAY
affect leaderboard ranking, cohort membership, or feature access. They MUST
NOT alter protocol-conformant raw metric calculations. A provider whose
telemetry is flagged by an anti-gaming signal may be excluded from a
leaderboard, but the Yield, Leverage, Velocity, output_fraction, and
log_leverage values computed from that telemetry must be the same values the
open conformance runner would produce.

### 2. Changed computation must be disclosed as a non-standard extension

If a private control changes how a metric is computed — for example, by
applying a correction factor, filtering inputs, or substituting a different
formula — the changed computation MUST be documented as a non-standard
extension. The documentation must:

- Identify the metric affected.
- Describe the change in computation.
- State that the result is not the protocol-conformant value.
- Be available to any party that receives the modified value.

A non-standard extension may be useful, but it may not be presented as a
conformant OTEP metric, and it may not be used in conformance claims.

### 3. Open metric calculations are independently reproducible

Open metric calculations MUST be independently reproducible from the
published specification alone. This means:

- The specification contains the complete formula, units, rounding behavior,
  and edge-case handling for each metric.
- The test vectors fix the expected outputs for a representative set of
  inputs.
- An implementer with no access to SignalAF source code, internal
  documentation, or proprietary models can produce a conformant
  implementation that passes the conformance runner.

If any of these conditions cannot be met, the metric is not fully specified
and the specification must be revised before the metric can be considered
part of the protocol.

## Boundary maintenance

The boundary defined here is maintained by the OTEP Steering Group. Changes
to the open side require an OTEP and follow the normal revision cycle. The
commercial side is managed by SignalAF and may change at any time, subject to
the constraint that closed behavior cannot secretly change open metric
meaning.

If a future version of SignalAF introduces a computation that affects a
metric's value and is not part of the open specification, that computation
must either be contributed to the open specification via an OTEP or be
documented as a non-standard extension per the rules above. There is no third
option.

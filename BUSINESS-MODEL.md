# SignalAF Business Model

**Status:** Draft — companion document to the OTEP specification
**Scope:** Revenue strategy for SignalAF (the commercial product built on the open OTEP protocol)
**Relationship to spec:** Non-normative. This document does not define protocol requirements. Where it references normative requirements (e.g., `SRP-CONF-005`, `SRP-CONF-006`), those requirements are authoritative and this document is subordinate.

---

## 1. Purpose

OTEP (Operator Token Efficiency Protocol) is an open measurement specification. SignalAF is the commercial product built on top of OTEP — it provides a hosted leaderboard, reference implementation, enterprise platform, and certification services. The central question this document answers is: **how does SignalAF build sustainable revenue without undermining the neutrality of the open protocol it sits on?**

The answer has two parts:

1. **The protocol core is non-excludable.** The four telemetry primitives (I, O, W, R), five derived metrics, conformance test suite, schema, and registries are published under open licenses (CC BY 4.0 for documents, Apache 2.0 for code). No revenue stream may close the core, gate conformance behind payment, or make the spec dependent on a single commercial entity's survival.

2. **Commercial value is created at the application layer.** SignalAF sells convenience, scale, integration, analytics, and operational services that are expensive to build and maintain but do not alter what the protocol measures or who may conform to it. A competitor or community fork can always run the open conformance suite and claim conformance on equal terms.

This separation is the foundation of the business model. Every revenue stream below is evaluated against it.

---

## 2. Revenue Streams

For each stream: **description**, **openness boundary** (what stays open vs. what's commercial), **neutrality risk**, **mitigation**, and **revenue potential** (low / medium / high).

---

### 2.1 Managed conformance services

**Description.** SignalAF operates a hosted conformance testing platform. Vendors submit their implementation, the platform runs the published conformance suite against it, and on a pass, SignalAF processes a certification — issuing a conformance certificate, listing the system in a public conformance registry, and providing a badge. SignalAF charges for the operational cost of running the test infrastructure, reviewing results, and issuing the certificate.

**Openness boundary.**
- **Open (non-excludable):** The conformance test suite itself (`conformance/runner.mjs` and `conformance/tests/`), the test vectors (`examples/fixtures/`), the conformance class definitions (`conformance/classes.md`), and the pass/fail criteria. Anyone may download and run these locally at no cost. A local pass is a valid conformance claim per `SRP-CONF-001`.
- **Commercial:** The hosted test infrastructure, the certificate issuance workflow, the public conformance registry maintained by SignalAF, and the badge asset. These are operational conveniences, not the test logic.

**Neutrality risk: Medium.** Certification is the most neutrality-sensitive revenue stream. If payment becomes a prerequisite for passing, the protocol is captured.

**Mitigation.**
- `SRP-CONF-005`: Payment MUST NOT be a prerequisite for conformance testing. The test suite is open and freely runnable.
- `SRP-CONF-006`: Certification marks MUST be based on published, appealable rules. Payment covers operational costs, not technical conformity.
- A vendor that runs the open suite locally and passes MUST be eligible for a certificate upon paying the operational processing fee — the fee cannot be tied to the test outcome.
- A vendor that fails the hosted suite receives the same failure report a local run would produce. There is no "paid re-test with relaxed criteria" path.

**Revenue potential: Medium.** Certification volume scales with ecosystem adoption. Early-stage volume is low; post-v1.0 with multiple implementations, volume grows.

---

### 2.2 Enterprise deployment

**Description.** SignalAF offers on-premise and private-cloud deployment of the Upsilon measurement engine for enterprise customers. This includes deployment automation, configuration management, air-gapped operation, and enterprise-grade telemetry ingestion pipelines that connect to internal provider endpoints without data leaving the customer's network.

**Openness boundary.**
- **Open:** The OTEP telemetry envelope schema, metric formulas, and adapter registry. An enterprise can build its own ingestion pipeline against the open spec without buying SignalAF.
- **Commercial:** The deployment automation, the Upsilon engine's operational tooling, internal dashboards, and the integration glue that connects enterprise identity systems to the telemetry pipeline.

**Neutrality risk: Low.** Enterprise deployment is a packaging and operations service. It does not alter the protocol.

**Mitigation.**
- Enterprise deployments MUST still conform to the same privacy requirements (`SRP-PRIV-001` through `SRP-PRIV-008`) and operator rights (`SRP-SEC-003`, `SRP-SEC-004`).
- An enterprise deployment that strips operator opt-out or telemetry-access rights is a conformance violation regardless of how much the customer paid.
- The open spec must remain sufficient for an enterprise to self-deploy without SignalAF, even if that requires more engineering effort.

**Revenue potential: High.** Enterprise deployment is the primary revenue driver. Enterprises pay for reliability, support, and the cost of building and maintaining production-grade infrastructure.

---

### 2.3 Private cohorts

**Description.** SignalAF curates private benchmarking cohorts for enterprise teams — groups of operators within or across organizations who share telemetry on a private, invite-only basis for comparative analysis. Cohorts have defined eligibility criteria, observation windows, and composition rules.

**Openness boundary.**
- **Open:** The cohort telemetry format (standard OTEP envelopes), the metric definitions used for comparison, and the claim-level disclosure requirements (`SRP-NON-005`, `SRP-NON-007`).
- **Commercial:** The cohort curation logic, eligibility thresholds, composition algorithms, and the private hosting infrastructure. Per `SPEC.md` §2.2, private cohort composition and eligibility thresholds are explicitly out of scope for the base protocol.

**Neutrality risk: Low–Medium.** Risk arises if cohort composition criteria implicitly favor or penalize certain providers or operators in ways that leak into public rankings.

**Mitigation.**
- Private cohorts MUST NOT feed public leaderboard rankings without explicit, disclosed eligibility criteria (`SRP-NON-007`).
- Cohort comparison claims MUST disclose observation window, aggregation method, and provenance level (`SRP-NON-005`).
- Cohort composition rules MUST be documented to cohort participants (transparency within the cohort), even if not publicly published.

**Revenue potential: Medium.** Cohorts are valuable to enterprises doing internal benchmarking but are a secondary revenue stream.

---

### 2.4 Advanced analytics

**Description.** SignalAF provides proprietary analytics beyond the open metric set: anomaly detection (flagging statistically improbable telemetry patterns), trend analysis (longitudinal metric trajectories), and comparative intelligence (cross-operator, cross-team, cross-provider comparisons with statistical context). These analytics operate on top of OTEP telemetry but produce insights not defined by the open spec.

**Openness boundary.**
- **Open:** The five core metrics (Υ, Leverage, Velocity, output_fraction, log_leverage), their formulas, rounding rules, and null semantics. Anyone can compute these from token counts.
- **Commercial:** The anomaly detection models, trend analysis algorithms, comparative intelligence heuristics, and the visualization layer. Per `SPEC.md` §2.2, longitudinal analysis methods are deferred to v0.2+ and are not part of the v0.1 core.

**Neutrality risk: Low.** Analytics are additive. They do not change what the protocol measures.

**Mitigation.**
- Advanced analytics MUST NOT be presented as OTEP metrics. They are SignalAF product features, not protocol-defined measurements.
- Analytics that produce scores or rankings MUST disclose their methodology at a level sufficient for independent critique, even if the implementation is proprietary.
- Anomaly flags in telemetry envelopes (`SRP-VAL-003`, `SRP-VAL-004`) are part of the open spec; proprietary anomaly *models* that go beyond the spec's recommended flags MUST be clearly labeled as SignalAF extensions.

**Revenue potential: High.** Analytics are the highest-margin product layer. They are expensive to build, defensible through accumulated data and model quality, and directly valuable to enterprise customers.

---

### 2.5 Network-derived benchmarks

**Description.** SignalAF aggregates telemetry from across its network of deployments (hosted and enterprise) to produce anonymized, aggregated benchmark datasets. These benchmarks provide industry-level baselines: "the median Yield for cohort X in window Y was Z." Customers pay for access to these benchmarks, which they cannot construct from their own data alone.

**Openness boundary.**
- **Open:** The metric definitions and aggregation rules (`SRP-AGG-001` through `SRP-AGG-004`) used to compute the benchmarks. The aggregation method is spec-defined.
- **Commercial:** The aggregated dataset itself, the data collection network, and the benchmark distribution infrastructure.

**Neutrality risk: Medium.** If benchmarks are derived from a biased sample (e.g., only SignalAF customers), they may implicitly favor certain provider ecosystems or operator profiles.

**Mitigation.**
- Benchmark datasets MUST disclose their composition: number of contributing organizations, provider distribution, observation window, and provenance level distribution.
- Benchmarks MUST NOT be presented as universal population norms. They are convenience samples of the SignalAF network.
- Anonymization MUST satisfy the privacy mode rules (`SRP-PRIV-001` through `SRP-PRIV-008`), including small-cell suppression (`SRP-PRIV-005`).
- The open spec MUST not depend on SignalAF benchmarks for conformance or metric validity. A system can conform without any reference to SignalAF's benchmarks.

**Revenue potential: Medium–High.** Network effects compound over time. Early value is low (small network); value grows nonlinearly with adoption.

---

### 2.6 SSO, audit, and governance

**Description.** SignalAF provides enterprise identity integration (SAML, OIDC, SCIM), audit trails (immutable logs of who accessed what telemetry and when), and governance dashboards (policy configuration, data retention controls, access delegation). These are standard enterprise platform features layered on top of OTEP telemetry.

**Openness boundary.**
- **Open:** The telemetry envelope, privacy mode definitions, and provenance levels. The spec defines what must be protected; it does not define how an enterprise authenticates users.
- **Commercial:** The SSO integration, audit log infrastructure, and governance dashboard UI.

**Neutrality risk: Low.** These are infrastructure features with no protocol impact.

**Mitigation.**
- Enterprise governance features MUST enforce the spec's privacy and operator-rights requirements, not weaken them. A governance dashboard that makes it easier to surveil employees without opt-out is a conformance violation (`SRP-SEC-003`, `SRP-SEC-004`).
- Audit trails MUST be available to operators for their own telemetry access logs, not just to administrators.

**Revenue potential: Medium.** Table-stakes for enterprise sales. Rarely the primary reason a customer buys, but expected as part of an enterprise package.

---

### 2.7 Support and SLAs

**Description.** SignalAF offers commercial support contracts with defined SLAs: response time guarantees, escalation paths, bug-fix commitments, and dedicated support engineers. This is the standard open-source-business-model revenue stream: the software is open, the support is paid.

**Openness boundary.**
- **Open:** The spec, the reference implementation, and the conformance suite. Anyone can use them without a support contract.
- **Commercial:** The support team, the SLA, and the escalation infrastructure.

**Neutrality risk: Low.** Support contracts do not affect protocol neutrality.

**Mitigation.**
- Support MUST NOT include preferential treatment in the OEP governance process. A paying customer's OEP proposal gets the same process as a community member's.
- Bug fixes discovered through support contracts MUST be contributed back to the open spec/reference implementation within the SLA's confidentiality window, not held as a proprietary advantage.

**Revenue potential: Medium.** Standard and predictable. Scales with enterprise customer count.

---

### 2.8 Partner programs

**Description.** SignalAF operates an integration partner program. Partners (tooling vendors, consultancies, system integrators) build OTEP-compatible adapters, dashboards, or deployment services. SignalAF certifies partners, lists them in a partner directory, and may share revenue on referrals or co-sold deployments.

**Openness boundary.**
- **Open:** The adapter registry (`adapters/registry.json`), the adapter registration requirements (`SRP-EXT-005`), and the conformance classes. Anyone can register an adapter without joining the partner program.
- **Commercial:** The partner directory, the partner certification badge, co-marketing, and revenue-sharing arrangements.

**Neutrality risk: Low–Medium.** Risk arises if partner-certified adapters receive preferential treatment in the open adapter registry or conformance process.

**Mitigation.**
- Partner certification MUST NOT affect adapter registry inclusion. A partner adapter and a community adapter face the same registration requirements (`SRP-EXT-005`).
- Partner status MUST NOT grant governance privileges. Partners do not get extra OEP votes.
- Revenue-sharing terms MUST be publicly disclosed at a summary level to prevent hidden conflicts of interest.

**Revenue potential: Low–Medium.** Partner programs are ecosystem accelerants more than direct revenue drivers. Indirect value through market expansion.

---

### 2.9 Training and accreditation

**Description.** SignalAF offers OTEP training courses (protocol fundamentals, adapter development, conformance testing, metric interpretation) and an operator accreditation program (certifying individuals as knowledgeable about OTEP measurement and its limitations). Courses are paid; accreditation requires passing an exam.

**Openness boundary.**
- **Open:** The spec itself, the glossary (`docs/GLOSSARY.md`), the limitations document (`docs/LIMITATIONS.md`), and the explicit non-inferences (`SPEC.md` §25). All knowledge required to understand OTEP is in the open documents.
- **Commercial:** The course curriculum, the exam, the accreditation credential, and the instructional delivery.

**Neutrality risk: Low.** Training is educational. Risk is limited to the accreditation credential being confused with conformance certification.

**Mitigation.**
- Operator accreditation (a person understands OTEP) MUST NOT be confused with system conformance certification (a system passes the conformance suite). These are separate credentials with separate names, visual designs, and criteria.
- Training materials MUST teach the explicit non-inferences (`SRP-NON-001` through `SRP-NON-007`) with equal prominence to the metric definitions. A training program that teaches people to misuse metrics as productivity proof undermines the protocol.
- The exam MUST include questions on prohibited interpretations and the Yield input² sensitivity limitation.

**Revenue potential: Low–Medium.** Training revenue is modest but builds ecosystem literacy, which reduces misuse risk and increases adoption.

---

### 2.10 Hosted leaderboard

**Description.** SignalAF operates the public SigRank leaderboard — a public ranking of operators by OTEP metrics. The leaderboard is free to view and free to submit to. SignalAF offers premium placement options: featured profiles, enhanced profile pages, sponsor badges, and promotional placement for partners.

**Openness boundary.**
- **Open:** The metric definitions, the ranking claim disclosure requirements (`SRP-NON-006`, `SRP-NON-007`), and the ability to submit telemetry at no cost.
- **Commercial:** Premium profile features, promotional placement, and sponsor badges.

**Neutrality risk: Medium.** A leaderboard is inherently a neutrality-sensitive surface. If premium placement affects ranking position or visibility, the leaderboard's credibility is compromised.

**Mitigation.**
- Premium placement MUST NOT affect ranking order. Ranking is determined solely by disclosed metric values and eligibility criteria.
- Premium features (enhanced profile, sponsor badge) MUST be visually distinguishable from ranking position. A user must be able to tell at a glance what is a rank and what is a paid placement.
- The leaderboard MUST disclose field definition, eligibility criteria, observation window, and provenance level (`SRP-NON-007`) on every view, not just in a buried methodology page.
- Free submission MUST remain available. No paywall on leaderboard participation.

**Revenue potential: Low–Medium.** Leaderboards are primarily an adoption and awareness engine. Direct monetization through premium placement is secondary and must be handled carefully to preserve credibility.

---

### 2.11 Private anti-abuse operations

**Description.** SignalAF operates abuse detection and prevention for leaderboard integrity: detecting fabricated telemetry, coordinated metric inflation, replay attacks, and other gaming behaviors. This is a proprietary operational capability — per `SPEC.md` §2.2, anti-gaming logic is explicitly out of scope for the base protocol and may remain proprietary (per `docs/GOVERNANCE.md` rule 4).

**Openness boundary.**
- **Open:** The provenance levels (`SPEC.md` §15), the anomaly flag mechanism in the envelope (`SRP-VAL-003`, `SRP-VAL-004`), and the threat model (`SPEC.md` §18.1). The spec defines what threats exist and what signals are available; it does not define detection algorithms.
- **Commercial:** The detection models, the investigation workflow, the enforcement actions, and the abuse-case database.

**Neutrality risk: Medium.** Anti-abuse operations are inherently opaque. If enforcement is arbitrary or biased, the leaderboard loses credibility. But if enforcement logic is fully open, abusers can evade it.

**Mitigation.**
- Enforcement actions (removal, downgrading, banning) MUST be appealable through a published process, consistent with the certification appeal principle.
- The *categories* of abuse SignalAF detects MUST be publicly documented, even if the specific detection thresholds are not.
- An operator removed from the leaderboard MUST receive a reason categorized against the published abuse categories.
- Anti-abuse operations MUST NOT be used to suppress competitors. If SignalAF removes a competitor's listing, the reason and appeal path must be the same as for any other operator.
- Per `docs/GOVERNANCE.md` rule 4: proprietary anti-gaming logic may remain proprietary without redefining the open core. This means the anti-abuse system MUST NOT introduce new metrics or redefine existing ones to support its detections — it operates on the open metric set.

**Revenue potential: Low.** Anti-abuse is a cost center, not a revenue stream. It is included here because it is necessary infrastructure for the leaderboard (which is an adoption driver) and because enterprise customers may pay for private anti-abuse services for their internal cohorts. Direct revenue is low; indirect value (leaderboard credibility) is high.

---

## 3. Certification Integrity

This section restates and elaborates the certification integrity requirements from `SPEC.md` §23. These are normative requirements (`SRP-CONF-005`, `SRP-CONF-006`); this section is explanatory, not substitutive.

### 3.1 Tests are published and open

Certification MUST be based on published, open conformance tests. The conformance suite (`conformance/runner.mjs`, `conformance/tests/`, `examples/fixtures/`) is published under Apache 2.0. The test vectors are in the repository. A vendor can inspect every test, run it locally, and verify the pass/fail logic before submitting for certification. There are no hidden tests that determine certification outcome.

### 3.2 Payment does not purchase conformity

Payment for certification services MAY cover operational costs: running the hosted test infrastructure, reviewing the submission, issuing the certificate, maintaining the public registry. Payment MUST NOT purchase technical conformity. A vendor that fails the conformance suite cannot pay to pass. A vendor that passes the conformance suite cannot be denied a certificate for non-payment of a fee unrelated to operational processing — though SignalAF may decline to issue the badge/registry listing if the operational fee is unpaid, the underlying conformance claim (the vendor passed the open suite) remains valid and the vendor may assert it independently.

### 3.3 Decisions are appealable

Certification decisions MUST be appealable through a published process. The appeal process MUST be documented before any certification is issued. An appeal MUST be reviewed by a party that did not make the original decision. The appeal process MUST have a defined timeline (acknowledgment within N days, resolution within M days). The outcome of an appeal (upheld, overturned, remanded) MUST be communicated to the appellant in writing with reasons.

### 3.4 Failed tests are not overridable by payment

A failed conformance test MUST NOT be overridable by payment. This is the single most important certification integrity rule. If a vendor's implementation fails `conformance/tests/primitives.mjs` because it emits negative token counts, no amount of money changes that result. The vendor must fix the implementation and re-test. The hosted certification platform may charge a re-test fee (covering operational cost), but the re-test runs the same open suite with the same pass/fail criteria.

---

## 4. Neutrality Safeguards

The following safeguards prevent commercial interests from capturing the protocol. They are binding on SignalAF and on any successor entity that operates certification, the leaderboard, or the reference implementation.

### 4.1 Open core non-excludability

The protocol core — primitives, metrics, schema, conformance suite, registries — is published under open licenses and cannot be retracted. Even if SignalAF ceases operations, the published artifacts remain usable under their perpetual licenses. The spec does not depend on SignalAF's continued existence for its validity.

### 4.2 Conformance is self-assertable

Per `SRP-CONF-001`, a system that passes the open conformance suite has a valid conformance claim, regardless of whether it went through SignalAF's hosted certification. SignalAF's certificate is a convenience and a trust signal (a third party verified the pass), not a gate. A competitor can self-certify and assert conformance on equal terms.

### 4.3 No pay-to-play in governance

The OEP process (`SPEC.md` §19.1, `docs/GOVERNANCE.md`) is open. OEP proposals are not gated by payment, partnership status, or customer relationship. A community member with no commercial relationship to SignalAF has the same OEP submission rights as SignalAF's largest enterprise customer. SignalAF employees participate in governance as individuals, not as a bloc; their proposals stand on merit.

### 4.4 Reference implementation is not the spec

The reference implementation (`reference/`) is an artifact that implements the spec; it is not the spec. Where the reference implementation does something not defined in the spec, that behavior is a reference-implementation choice, not a protocol requirement. This prevents "the reference impl is the spec" capture, where the commercial entity's implementation choices become de facto protocol rules. See `RISK-REGISTER.md` risk R-10.

### 4.5 Trademark policy

The OTEP name and conformance marks are governed by a published trademark policy. Non-conformant products MUST NOT use the marks. Conformant products MAY use the marks, regardless of commercial relationship to SignalAF. The trademark policy MUST NOT be used to exclude competitors that conform. See `RISK-REGISTER.md` risk R-08.

### 4.6 Revenue-stream neutrality audit

SignalAF conducts an annual neutrality audit of its revenue streams. The audit evaluates each stream against the openness boundary and mitigation commitments in this document. The audit is published. If a stream is found to have breached its openness boundary, SignalAF commits to remediation within a defined timeline or sunset of the stream.

### 4.7 Second-implementation requirement

Per `SRP-CONF-004`, `SigRank Conformant` / `OTEP Conformant` is reserved until a third-party implementation passes the conformance suite independently. SignalAF's own implementation cannot establish the conformance mark alone. This prevents the commercial entity from being the sole arbiter of conformance. See `RISK-REGISTER.md` risk R-13.

### 4.8 Spec revenue firewall

Revenue decisions are organizationally firewalled from spec decisions. The team that defines metric semantics, conformance criteria, and privacy requirements does not report to the team that sets pricing for certification, enterprise deployment, or analytics. This reduces the pressure to alter the spec to support a revenue target. Where the organization is too small for a formal firewall, a documented separation-of-duties protocol applies: spec changes require review by a person not on the revenue team.

### 4.9 Sunset commitment

If SignalAF ceases operations or is acquired, the protocol core remains open under its existing licenses. The conformance suite, registries, and spec documents are transferred to a neutral steward (a foundation, working group, or community-maintained fork) rather than retracted. SignalAF commits to maintaining the open artifacts in a state that permits independent continuation. This is a social commitment, not a legal guarantee — but it is stated publicly so that the community can hold the entity accountable and plan for continuity.

---

## 5. Revenue Summary

| # | Stream | Revenue Potential | Neutrality Risk |
|---|--------|-------------------|-----------------|
| 2.1 | Managed conformance services | Medium | Medium |
| 2.2 | Enterprise deployment | High | Low |
| 2.3 | Private cohorts | Medium | Low–Medium |
| 2.4 | Advanced analytics | High | Low |
| 2.5 | Network-derived benchmarks | Medium–High | Medium |
| 2.6 | SSO, audit, and governance | Medium | Low |
| 2.7 | Support and SLAs | Medium | Low |
| 2.8 | Partner programs | Low–Medium | Low–Medium |
| 2.9 | Training and accreditation | Low–Medium | Low |
| 2.10 | Hosted leaderboard | Low–Medium | Medium |
| 2.11 | Private anti-abuse operations | Low | Medium |

**Primary revenue:** Enterprise deployment (2.2) and advanced analytics (2.4).
**Secondary revenue:** Network-derived benchmarks (2.5), managed conformance (2.1), support/SLAs (2.7), SSO/audit/governance (2.6).
**Ecosystem investment:** Leaderboard (2.10), anti-abuse (2.11), training (2.9), partner programs (2.8) — low direct revenue, high adoption and credibility value.

---

## 6. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 0.1-draft | 2026-08-28 | Initial business model document. Eleven revenue streams evaluated. Certification integrity and neutrality safeguards sections added. |

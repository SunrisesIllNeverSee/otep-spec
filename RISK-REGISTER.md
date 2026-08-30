# TTEOP Risk Register

**Status:** Draft — companion document to the TTEOP specification
**Scope:** Risks to the TTEOP protocol, its ecosystem, and the SignalAF commercial product built on it
**Relationship to spec:** Non-normative. This document supports but does not define protocol requirements. Where it references normative requirements, those requirements are authoritative.

---

## 1. Purpose

This register identifies the risks that could compromise the TTEOP protocol's validity, neutrality, adoption, or safety. For each risk: what it is, how to detect it, how to prevent it, how to respond when it materializes, who owns it, and whether it can halt a release (stop/go gate).

**Stop/Go gate** means: if this risk is realized and unmitigated at a release checkpoint, does it block the release?

- **Stop** — the release cannot proceed until the risk is mitigated.
- **Go** — the release may proceed with the risk documented and a mitigation plan tracked.
- **Stop (conditional)** — the release is blocked only if specific conditions are met (noted in the response).

---

## 2. Summary Table

| Risk ID | Risk | Warning Indicators | Prevention | Detection | Response | Owner | Stop/Go Gate |
|---------|------|--------------------|------------|-----------|----------|-------|--------------|
| R-01 | Metric invalidity | Public claims associating metrics with productivity without study design | `SRP-NON-001`–`SRP-NON-007`; limitations docs; training | Periodic claim audit; community reports; conformance prohibited-interpretation tests | Issue violation; require correction; suspend certificate if needed; TEP for spec-level fixes | Spec editor | Stop |
| R-02 | Provider incompatibility | Conformance failures across providers; conflicting adapter policies | `SRP-ADAPT-001`–`SRP-ADAPT-012`; adapter registry; null semantics | Conformance suite Adapter class tests; cross-provider comparison tests | TEP to clarify mapping; fix adapter; document null for incompatible providers | Adapter registry maintainer | Stop (conditional) |
| R-03 | Metric gaming | Anomalous input clustering; implausible cache_read ratios; sudden metric jumps | Provenance levels; anomaly flags; signed envelopes; anti-abuse ops | Anomaly flags; statistical monitoring; community reports | Downgrade provenance; remove leaderboard entries; publish abuse category; document gaming vectors | Anti-abuse operations lead | Go |
| R-04 | Privacy leakage | `identity_leak` errors; re-identification reports; suppression threshold gaps | `SRP-PRIV-001`–`SRP-PRIV-008`; `SRP-DATA-011`; `SRP-VAL-005`/`006`; conformance privacy tests | Automated validation; periodic re-identification audit; penetration testing | Reject envelope; purge records within 30 days; notify operators; emergency TEP for spec gaps | Privacy officer | Stop |
| R-05 | Employee-surveillance misuse | Per-employee dashboards without opt-out; disabled operator rights; performance-review use | `SRP-SEC-003`/`SRP-SEC-004`; contractual terms in enterprise agreements | Annual enterprise audit; operator feedback channel; contractual audit rights | Breach notice; require remediation; terminate agreement if unremedied; publish anonymized case study | Enterprise compliance lead | Stop (conditional) |
| R-06 | False productivity claims | Marketing saying "higher Yield = productivity"; case studies as productivity proof | `SRP-NON-001`–`SRP-NON-004`; claim-level classification; training | Audit of public-facing claims; community monitoring of press coverage | Correction notice; require reclassification or removal; public correction if SignalAF; conformance violation if certified system | Spec editor / Marketing review | Go |
| R-07 | Certification capture | Pass rates correlated with customer status; fees exceeding cost; hidden criteria; opaque appeals | `SRP-CONF-005`/`SRP-CONF-006`; published tests; appealable rules; annual neutrality audit | Annual audit of certification outcomes; community reports; hosted vs. local result comparison | Publish findings; restructure certification independence; refund improper denials; transfer to neutral party if systemic | Certification authority / Governance body | Stop |
| R-08 | Trademark abuse | Marks on non-conformant products; marks after version break; filings by other parties | Published trademark policy; `SRP-CONF-002`/`SRP-CONF-003`/`SRP-CONF-004` | Periodic market scan; community reporting; trademark monitoring service | Cease-and-desist; require conformance or removal; oppose trademark filings | Legal / Trademark holder | Go |
| R-09 | Governance capture | TEP acceptance correlated with affiliation; one party always prevails; no external TEPs accepted | Open TEP process; no payment/partnership requirement; documented decision criteria; separation of duties | Annual governance audit; community survey; periodic external review | Restructure governance body; term limits; transfer to neutral body if unremediable; publish audit and remediation | Governance body / Spec editor | Stop (conditional) |
| R-10 | Reference implementation dominance | Bug reports against alternatives for unspecified behavior; tests tracing to ref-impl not spec; "see reference" for normative behavior | Spec is authority; conformance tests trace to normative requirements; ref-impl choices are one option | Audit conformance tests for spec coverage; review "match the reference" bug reports | Remove/rewrite invalid tests; TEP to specify gaps; don't let ref-impl silently fill gaps | Spec editor / Conformance maintainer | Stop |
| R-11 | Proprietary extensions fragmenting | Unqualified extension names; proprietary metrics as TTEOP metrics; core semantic redefinition; divergent forks | `SRP-EXT-001`–`SRP-EXT-005`; TEP process; namespace prefixes; registry requirements | Scan implementations for unregistered/unqualified extensions; community reports; namespace compliance tests | Conformance violation for unqualified names; require registration or remove claim; TEP to standardize shared behavior; engage fork maintainers | Spec editor / Registry maintainer | Go |
| R-12 | Premature formal-standard claims | "Standard" without "draft" qualifier; ISO/IEC claims; spec referencing completed standardization | `SPEC.md` §1 draft status; §2.2 defers formal standardization; `README.md` "proposed" label | Audit marketing/docs/press for premature claims; community reports | Correction; remove claim; clarify draft status; document as governance violation if knowing | Spec editor / Marketing review | Go |
| R-13 | Lack of a second implementation | Zero third-party implementations; all testing on SignalAF's impl; no external TEPs; spec too SignalAF-specific | `SRP-CONF-004` reserves Conformant for third-party; implementation guides; integration examples; self-contained spec | Track independent implementations in registry; survey non-SignalAF developers on difficulty | Prioritize spec clarity; offer implementation grants/bounties; hackathon; TEPs to fix spec blockers; no Conformant claim until second impl passes | Spec editor / Ecosystem lead | Stop (conditional) |
| R-14 | Competitors forking or embracing | Competitor TTEOP-compatible product with unregistered extensions; extensions gaining share; "real TTEOP" marketing; divergent forks | Open core under perpetual license; TEP for standardizing extensions; trademark policy; namespace requirements; `SRP-CONF-004` | Monitor competitive landscape; track fork divergence; community reports of fragmentation | Engage competitor to submit TEP; standardize beneficial extensions; publish compatibility advisory for incompatible forks; trademark enforcement for core-semantic divergence | Spec editor / Ecosystem lead / Legal | Go |
| R-15 | Υ scale-dependency confusion | Cross-operator Υ comparisons without input-scale control; leaderboard dominated by low-input operators; "nothing changed" Υ jumps | `SPEC.md` §26.1 documents input²; `metrics/yield.md` full analysis; `docs/LIMITATIONS.md`; training includes input² topic | Monitor leaderboard for scale artifacts; track support tickets on Υ interpretation; survey user understanding | Publish clarification; add leaderboard warning for large input-scale ratios; TEP for scale-normalized variant; ensure training/exam coverage | Spec editor / Metrics maintainer | Go |

---

## 3. Detailed Risk Entries

### R-01: Metric invalidity

**Description.** Metrics don't measure what they claim. Yield, Leverage, Velocity, output_fraction, or log_leverage are presented as measuring something they do not — productivity, code quality, task success, professional skill, or business impact. This is the most fundamental risk: if the metrics are invalid or misused, the entire protocol loses credibility.

**Warning indicators.** Public claims associating TTEOP metrics with productivity, code quality, or business outcomes without study design. Marketing copy implying causal claims. Users treating Υ as a skill score. Leaderboard rankings interpreted as skill rankings.

**Prevention.** `SRP-NON-001` through `SRP-NON-007` prohibit false claims and require claim-level classification (descriptive, comparative, associational, causal). `docs/LIMITATIONS.md` documents measurement boundaries. Training materials (see `BUSINESS-MODEL.md` §2.9) must teach non-inferences with equal prominence to definitions.

**Detection.** Periodic audit of public claims (leaderboard, marketing, blog posts, customer communications) for prohibited interpretations. Community reports of misuse via issues. Conformance suite includes a prohibited-interpretation test class that flags systems presenting metrics as productivity proof.

**Response.** Issue conformance violation notice. Require removal or correction of the false claim. Publish a clarification. If a conformance-certified system makes prohibited claims, suspend the certificate until corrected. For spec-level invalidity (the formula itself doesn't measure what the spec defines), open an TEP to revise the metric and increment the version.

**Owner.** Spec editor.

**Stop/Go gate.** **Stop** — if a metric formula is demonstrably invalid (computes something other than what the spec defines), the release is blocked until the formula is corrected or the metric is deprecated.

---

### R-02: Provider incompatibility

**Description.** Different providers expose incompatible telemetry. Provider A's API exposes cache_read; Provider B's does not. Adapter mappings produce semantically divergent primitives for the same conceptual operation, making cross-provider comparisons invalid.

**Warning indicators.** Conformance failures in the Adapter class across multiple providers. Adapter registry entries with conflicting double-counting policies. Community reports that the same workflow produces materially different metrics depending on provider.

**Prevention.** `SRP-ADAPT-001` through `SRP-ADAPT-012` define adapter mapping rules, double-counting policies, and missing-field handling. Adapter registry (`adapters/registry.json`) documents per-provider mappings. Null semantics (`SRP-MISS-001`–`SRP-MISS-003`) handle unavailable fields consistently.

**Detection.** Run the conformance suite's Adapter class tests against every registered adapter before each release. Cross-provider comparison tests: run the same canonical workflow through two adapters and flag metric divergence beyond a documented threshold.

**Response.** If divergence is a spec ambiguity, open an TEP to clarify the mapping rule. If divergence is an adapter bug, fix the adapter and re-register. If a provider's API is fundamentally incompatible (no cache telemetry), document the limitation in the adapter registry and mark affected metrics as null for that provider — do not fabricate values.

**Owner.** Adapter registry maintainer.

**Stop/Go gate.** **Stop (conditional)** — blocks release if a registered adapter fails the conformance suite. Does not block if the incompatibility is documented and results in null metrics per spec.

---

### R-03: Metric gaming

**Description.** Operators manipulate behavior to inflate metrics. An operator artificially reduces input tokens (by pre-caching or splitting prompts) to inflate Yield, since Υ is quadratically sensitive to input. Other gaming vectors include fabricating cache_read values, replaying valid envelopes, and coordinating with other operators to manipulate cohort baselines.

**Warning indicators.** Statistical anomalies in telemetry: input values clustered at suspiciously low integers, cache_read/input ratios far exceeding network norms, sudden metric jumps uncorrelated with workflow changes. Leaderboard entries with implausible metric profiles.

**Prevention.** Provenance levels (`SPEC.md` §15) require evidence for claimed provenance. Anomaly detection (`SRP-VAL-003`, `SRP-VAL-004`) flags suspicious envelopes. Signed envelopes (`SRP-SIG-001`–`SRP-SIG-003`) prevent post-hoc fabrication. Anti-abuse operations (`BUSINESS-MODEL.md` §2.11) investigate and enforce.

**Detection.** Anomaly flags in submitted telemetry. Statistical monitoring of leaderboard entries for gaming patterns. Community reports. Cross-checking telemetry against provider-side API logs where available (enterprise mode).

**Response.** Downgrade provenance level for suspicious envelopes. Remove confirmed gaming entries from the leaderboard. Publish the abuse category (not the operator's identity) as a deterrent. For spec-level gaming resistance, document known gaming vectors in `docs/LIMITATIONS.md` and consider TEPs for gaming-resistant metric variants in future versions.

**Owner.** Anti-abuse operations lead.

**Stop/Go gate.** **Go** — gaming is a persistent, ongoing risk that cannot be fully eliminated. It does not block release but requires continuous operational response.

---

### R-04: Privacy leakage

**Description.** Real-world identity or sensitive data exposed in telemetry. An envelope contains a user's name, email, or inferred identity in metadata fields. Small-cell suppression fails and a pseudonymous operator is re-identified from aggregate data.

**Warning indicators.** Conformance failures in the Privacy-profile class. `identity_leak` error codes from validators. Community reports of re-identification. Audit findings showing small-cell suppression thresholds are too low for the dataset size.

**Prevention.** `SRP-PRIV-001` through `SRP-PRIV-008` define privacy modes, content independence, small-cell suppression, and deletion rules. `SRP-DATA-011` forbids real-world identity in any mode. `SRP-VAL-005`/`SRP-VAL-006` forbid semantic content and forbidden field names. Conformance suite includes privacy and content-independence tests.

**Detection.** Automated validation of every envelope for identity leakage and forbidden fields. Periodic privacy audit of the leaderboard dataset for re-identification risk. Penetration testing of the hosted platform.

**Response.** Reject the envelope (`identity_leak` error). If leakage has already occurred, purge the affected records within 30 days (`SRP-PRIV-006`). Notify affected operators. If the leakage is a spec gap (a field that should be forbidden isn't), open an emergency TEP to add it to the forbidden list.

**Owner.** Privacy officer.

**Stop/Go gate.** **Stop** — privacy leakage is a hard stop. If the conformance suite's Privacy-profile tests fail, or if a live leakage is confirmed, the release is blocked until the gap is closed.

---

### R-05: Employee-surveillance misuse

**Description.** Employers use TTEOP metrics for surveillance. An enterprise deployment uses Yield or Velocity to monitor individual employees, rank them, or make employment decisions without operator consent or opt-out. This is both a spec violation (`SRP-SEC-003`, `SRP-SEC-004`) and a real-world harm.

**Warning indicators.** Enterprise customer requests for per-employee metric dashboards without operator access. Deployment configurations that disable operator opt-out. Customer support tickets asking how to use metrics for performance reviews.

**Prevention.** `SRP-SEC-003` prohibits using TTEOP metrics as the sole basis for employment decisions. `SRP-SEC-004` requires enterprise deployments to provide operators with access to their own telemetry, opt-out rights, and transparency about collection and use. Enterprise deployment agreements include these requirements as contractual terms.

**Detection.** Annual audit of enterprise deployments for compliance with `SRP-SEC-003`/`SRP-SEC-004`. Operator feedback channel (anonymous reporting of surveillance misuse). Contractual right to audit enterprise customers.

**Response.** If an enterprise customer is found using metrics for surveillance in violation of `SRP-SEC-003`/`SRP-SEC-004`: issue a contractual breach notice. Require remediation (restore opt-out, provide operator access). If unremedied, terminate the enterprise agreement and revoke the deployment license. Publish an anonymized case study as a deterrent.

**Owner.** Enterprise compliance lead.

**Stop/Go gate.** **Stop (conditional)** — blocks release of enterprise features if those features facilitate surveillance without operator rights. Does not block protocol releases, but blocks enterprise product releases that violate `SRP-SEC-003`/`SRP-SEC-004`.

---

### R-06: False productivity claims

**Description.** Metrics presented as productivity proof. A vendor, enterprise, or SignalAF itself presents TTEOP metrics as proof that an operator, tool, or workflow is "more productive" — a prohibited causal claim without study design. This is closely related to R-01 but focuses on external claims rather than metric validity itself.

**Warning indicators.** Marketing materials saying "higher Yield = higher productivity." Customer case studies presenting metric improvements as productivity gains. Press coverage interpreting leaderboard rankings as skill rankings.

**Prevention.** `SRP-NON-001` prohibits presenting metrics as proof of productivity. `SRP-NON-004` requires study design for causal claims. `SRP-NON-003` requires claim-level classification (descriptive, comparative, associational, causal). Training and accreditation (§2.9) teach the distinction.

**Detection.** Audit of all public-facing claims (SignalAF marketing, partner marketing, customer case studies) for claim-level compliance. Community monitoring of press coverage for misinterpretation.

**Response.** Issue a correction notice for the false claim. Require the claimant to reclassify the claim (e.g., from causal to descriptive) or remove it. If SignalAF itself makes the claim, publish a public correction. If a conformance-certified system makes false productivity claims, treat as a conformance violation per `SRP-NON-002`.

**Owner.** Spec editor / Marketing review.

**Stop/Go gate.** **Go** — false claims are an ongoing misuse risk. They do not block release but require continuous monitoring and response. Escalates to Stop if the false claim originates from the spec itself (the spec text implies productivity).

---

### R-07: Certification capture

**Description.** Certification process captured by commercial interests. SignalAF (or a successor) uses the certification process to favor its own products, exclude competitors, or extract revenue by denying certification to non-customers. This is the most direct threat to protocol neutrality.

**Warning indicators.** Certification pass rates correlated with customer status. Certification fees that exceed operational cost by a large margin. Certification criteria that are not in the published conformance suite. Appeals process that is opaque, untimely, or always rules against the appellant.

**Prevention.** `SRP-CONF-005`: payment is not a prerequisite for conformance testing. `SRP-CONF-006`: certification is based on published, appealable rules; payment covers operational costs, not conformity. `BUSINESS-MODEL.md` §3 requires published tests, appealable decisions, and no payment override of failed tests. Annual neutrality audit (§4.6).

**Detection.** Annual neutrality audit of certification outcomes: pass rates by customer status, fee-to-cost ratio, appeal outcomes. Community reports of certification denial. Comparison of hosted certification results vs. local self-certification results — they must match.

**Response.** If certification capture is detected: publish the audit findings. Restructure the certification process to restore independence (separate the certification team from the revenue team). Refund improperly denied certification fees. If capture is systemic and unremediable, transfer certification to a neutral third party.

**Owner.** Certification authority / Governance body.

**Stop/Go gate.** **Stop** — if certification capture is confirmed (certification decisions are being made on commercial rather than technical grounds), all certification activity halts until independence is restored.

---

### R-08: Trademark abuse

**Description.** TTEOP name misused by non-conformant products. A vendor uses the "TTEOP Conformant" or "SigRank Compatible" mark on a product that has not passed the conformance suite, or on a product that fails it. This dilutes the mark's value and misleads users.

**Warning indicators.** Products displaying conformance marks without a published conformance claim. Products using the marks after a spec version change that breaks their compatibility. Trademark filings by parties other than the designated holder.

**Prevention.** Published trademark policy defining mark usage rules. `SRP-CONF-002` prohibits claiming conformance to an untested class. `SRP-CONF-003` requires conformance claims to identify versions. `SRP-CONF-004` reserves "Conformant" for third-party-verified implementations.

**Detection.** Periodic market scan for misuse of the marks. Community reporting channel. Trademark monitoring service for filings.

**Response.** Send a cease-and-desist for mark misuse. Require the vendor to remove the mark or complete conformance testing. If the vendor conforms, authorize the mark. If not, enforce removal. For trademark filings by other parties, oppose the filing.

**Owner.** Legal / Trademark holder.

**Stop/Go gate.** **Go** — trademark abuse is an enforcement matter, not a release blocker. Escalates to Stop if the trademark holder itself is the abuser (using the mark to exclude conformant competitors).

---

### R-09: Governance capture

**Description.** Governance process dominated by one party. A single entity (SignalAF, a large enterprise customer, or a consortium) controls the TEP process such that proposals favorable to that entity pass and proposals unfavorable to it are blocked.

**Warning indicators.** TEP acceptance rates correlated with proposer's affiliation. TEP discussions where a single party's position always prevails. Governance meetings dominated by one organization's employees. Long periods with no accepted external TEPs.

**Prevention.** Open TEP process (`docs/GOVERNANCE.md`) with public submission and discussion. No payment or partnership requirement for TEP submission. Documented decision criteria. Separation of duties between spec and revenue teams (`BUSINESS-MODEL.md` §4.8).

**Detection.** Annual governance audit: TEP submission/acceptance rates by affiliation. Community survey on governance fairness. External review of the TEP process by an independent party on a periodic basis.

**Response.** If governance capture is detected: restructure the governance body to ensure diverse representation. Introduce term limits for governance roles. Transfer governance to a neutral body (foundation, working group) if capture is unremediable. Publish the audit and remediation plan.

**Owner.** Governance body / Spec editor.

**Stop/Go gate.** **Stop (conditional)** — blocks release if a normative change was accepted through a captured process. The change must be re-reviewed under a restructured process before release.

---

### R-10: Reference implementation dominance

**Description.** Reference impl defines behavior not in spec. The SignalAF reference implementation does something reasonable that the spec doesn't define, and other implementers copy it to achieve compatibility, making the reference impl the de facto spec.

**Warning indicators.** Bug reports against alternative implementations that "don't match the reference" on behavior the spec doesn't define. Conformance tests that test reference-implementation behavior rather than spec-defined behavior. Spec text that says "see reference implementation" for normative behavior.

**Prevention.** The spec is the authority; the reference implementation is an artifact. Conformance tests test spec-defined behavior, not reference-implementation behavior. Where the spec is silent, the reference implementation's choice is one valid option, not the only option. Document this principle in `reference/IMPLEMENTATION_MAP.md`.

**Detection.** Audit conformance tests for spec-coverage: every test must trace to a normative requirement, not to reference-impl behavior. Review bug reports for "match the reference" complaints that indicate spec gaps.

**Response.** If a conformance test tests behavior not in the spec, remove or rewrite it to test spec-defined behavior. If the spec is silent on a behavior that multiple implementers need, open an TEP to specify it — don't let the reference impl silently fill the gap.

**Owner.** Spec editor / Conformance suite maintainer.

**Stop/Go gate.** **Stop** — if a conformance test cannot be traced to a normative spec requirement, the test is invalid and blocks release until corrected.

---

### R-11: Proprietary extensions fragmenting the protocol

**Description.** Incompatible extensions. SignalAF or a competitor introduces proprietary extensions (new metrics, new fields, new privacy modes) that are not registered through the TEP process and are incompatible with other implementations.

**Warning indicators.** Extensions in the `extensions` object that use unqualified names (violating `SRP-EXT-003`). Proprietary metrics presented as TTEOP metrics. Extensions that redefine core metric semantics. Forks of the spec that diverge without an TEP.

**Prevention.** `SRP-EXT-001` requires normative changes to go through the TEP process. `SRP-EXT-002` requires extensions to be registered. `SRP-EXT-003` requires namespace prefixes for custom extensions. `SRP-EXT-004`/`SRP-EXT-005` define registry requirements for metrics and adapters.

**Detection.** Periodic scan of published implementations for unregistered or unqualified extensions. Community reports of incompatibility. Conformance suite tests for namespace compliance.

**Response.** If an extension violates `SRP-EXT-003` (unqualified names), issue a conformance violation. If an extension is unregistered, require registration or removal of the conformance claim. If extensions are incompatible, facilitate an TEP to standardize the shared behavior. If a fork diverges, engage the fork maintainers to reconcile via TEP or document the divergence as a separate profile.

**Owner.** Spec editor / Registry maintainer.

**Stop/Go gate.** **Go** — extensions are expected and permitted within the rules. Blocks release only if a core metric or field is altered without an TEP (which is a normative violation, escalating to Stop).

---

### R-12: Premature formal-standard claims

**Description.** Claiming ISO/IEC status prematurely. Marketing, documentation, or public statements claim TTEOP is an "ISO standard," "IEC standard," "industry standard," or "formally standardized" before any such recognition exists.

**Warning indicators.** Use of "standard" without the "draft" or "specification" qualifier in formal contexts. Press releases claiming standardization. Spec documents referencing ISO/IEC processes as completed rather than deferred.

**Prevention.** `SPEC.md` §1 explicitly states TTEOP is a draft, not a formal standard. `SPEC.md` §2.2 defers formal standardization to post-v1.0. `README.md` labels the spec as "proposed." Review of all public communications for standardization claims.

**Detection.** Audit of marketing, documentation, and press coverage for premature claims. Community reports.

**Response.** Issue a correction. Remove the premature claim. Clarify that TTEOP is a draft specification, not a formal standard. If the claim was made knowingly, document it as a governance violation.

**Owner.** Spec editor / Marketing review.

**Stop/Go gate.** **Go** — premature claims are a communication error, not a release blocker. Escalates to Stop if the spec document itself claims formal-standard status (which would be a spec defect).

---

### R-13: Lack of a second implementation

**Description.** Only SignalAF implements TTEOP. No third-party implementation exists or has passed the conformance suite, so "TTEOP Conformant" cannot be claimed (`SRP-CONF-004`) and the protocol's interoperability is untested across independent implementations.

**Warning indicators.** Zero third-party implementations in the conformance registry. All conformance testing done on SignalAF's own implementation. No external TEP submissions. Community reports that the spec is too SignalAF-specific to implement independently.

**Prevention.** `SRP-CONF-004` reserves the "Conformant" mark for third-party-verified implementations, preventing self-certification as the sole path. Publish implementation guides (`reference/IMPLEMENTATION_MAP.md`). Provide integration examples (`integrations/`). Keep the spec self-contained (not dependent on SignalAF-specific behavior).

**Detection.** Track the number of independent implementations in the conformance registry. Monitor for community attempts to implement and their blockers. Survey non-SignalAF developers on implementation difficulty.

**Response.** If no second implementation exists by a target milestone (e.g., v0.5): prioritize spec clarity issues raised by would-be implementers. Offer implementation grants or bounties. Run an implementation hackathon. If the spec is the blocker (ambiguous, incomplete, or SignalAF-specific), open TEPs to fix it. Do not claim "Conformant" status until the second implementation passes.

**Owner.** Spec editor / Ecosystem lead.

**Stop/Go gate.** **Stop (conditional)** — blocks claiming "TTEOP Conformant" status (per `SRP-CONF-004`). Does not block draft releases, but blocks any release that claims the Conformant mark without a second implementation.

---

### R-14: Competitors forking or embracing the protocol

**Description.** Embrace-extend-extinguish. A large competitor embraces TTEOP, extends it with proprietary features that become popular, and either extinguishes the open version by making the proprietary extension a de facto requirement or fragments the ecosystem into incompatible forks.

**Warning indicators.** A competitor launches an TTEOP-compatible product with proprietary extensions that are not TEP-registered. The competitor's extensions gain significant market share. The competitor's marketing positions its extensions as "the real TTEOP." Forks that diverge on core metric semantics.

**Prevention.** Open core under perpetual license (cannot be retracted). TEP process for standardizing popular extensions before they fragment. Trademark policy preventing "TTEOP" misuse. Namespace requirements (`SRP-EXT-003`) preventing extension collisions. `SRP-CONF-004` requiring third-party verification.

**Detection.** Monitor the competitive landscape for TTEOP-compatible products and their extension strategies. Track fork activity and divergence. Community reports of fragmentation pressure.

**Response.** If a competitor's extension is gaining traction, engage the competitor to submit it as an TEP. If the extension is beneficial, standardize it. If the competitor refuses to participate and creates incompatible fragmentation, publish a compatibility advisory distinguishing TTEOP-conformant products from the competitor's extended fork. Use the trademark to prevent the competitor from calling its fork "TTEOP" if it diverges on core semantics.

**Owner.** Spec editor / Ecosystem lead / Legal.

**Stop/Go gate.** **Go** — embrace-extend is a strategic risk, not a release blocker. Escalates to Stop if a fork's divergence is adopted into the open spec without due TEP process (which would be a governance violation).

---

### R-15: Υ scale-dependency confusion

**Description.** Users misinterpret Yield due to input² sensitivity. Yield (Υ) = (cache_read × output) / input² is quadratically sensitive to input. A small reduction in input produces a large increase in Υ, even if cache_read and output are unchanged. Users compare Υ values across operators with different input scales and draw invalid conclusions.

**Warning indicators.** Users comparing Υ across operators with materially different input volumes. Leaderboard rankings dominated by low-input operators. Blog posts or analyses interpreting high Υ as "better" without controlling for input scale. Customer questions about why Υ changed dramatically when "nothing changed."

**Prevention.** `SPEC.md` §26.1 documents the input² limitation. `metrics/yield.md` provides full analysis. `docs/LIMITATIONS.md` documents the scale-dependency boundary. Training (§2.9) includes input² sensitivity as a required topic. Leaderboard discloses observation window and provenance (`SRP-NON-007`).

**Detection.** Monitor leaderboard for scale-dependent ranking artifacts. Track community questions and support tickets related to Υ interpretation. Survey users on their understanding of the input² limitation.

**Response.** If confusion is widespread: publish a clarification on the input² sensitivity. Add a visual warning on the leaderboard when comparing Υ across operators with input-scale ratios exceeding a documented threshold. Consider an TEP for a scale-normalized Yield variant in a future version (without replacing the original Υ). Ensure training materials and the exam cover this limitation prominently.

**Owner.** Spec editor / Metrics maintainer.

**Stop/Go gate.** **Go** — interpretation confusion is an ongoing educational risk. Escalates to Stop if the spec text itself fails to document the input² limitation (which would be a spec defect requiring correction before release).

---

## 4. Risk Prioritization

| Priority | Risk IDs | Rationale |
|----------|----------|-----------|
| **Critical (Stop by default)** | R-01, R-04, R-07, R-10 | Metric invalidity, privacy leakage, certification capture, and reference-implementation dominance are existential threats to the protocol's credibility. Each can halt a release. |
| **High (Stop conditional)** | R-02, R-05, R-09, R-13 | Provider incompatibility, employee surveillance, governance capture, and lack of a second implementation block specific release types (adapter releases, enterprise features, normative changes, Conformant claims) but not all releases. |
| **Medium (Go with monitoring)** | R-03, R-06, R-08, R-11, R-14, R-15 | Gaming, false productivity claims, trademark abuse, extension fragmentation, competitive embrace, and Υ confusion are persistent, ongoing risks that require continuous monitoring and response but do not block releases. |
| **Low (Go)** | R-12 | Premature formal-standard claims are communication errors, easily corrected. |

---

## 5. Review Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Full risk register review | Quarterly | Spec editor |
| Conformance suite audit (R-01, R-02, R-10) | Per release | Conformance suite maintainer |
| Privacy audit (R-04, R-05) | Annually + on any privacy-mode change | Privacy officer |
| Neutrality audit (R-07, R-09) | Annually | Governance body |
| Trademark scan (R-08) | Semi-annually | Legal |
| Ecosystem scan (R-13, R-14) | Semi-annually | Ecosystem lead |
| Community misuse monitoring (R-03, R-06, R-15) | Continuous | Anti-abuse operations / Spec editor |

---

## 6. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 0.1-draft | 2026-08-28 | Initial risk register. 15 risks identified across metric validity, provider compatibility, gaming, privacy, misuse, certification, governance, implementation, fragmentation, and interpretation dimensions. |

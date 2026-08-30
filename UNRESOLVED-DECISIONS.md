# Unresolved Decisions Requiring Founder Approval

**Status:** Draft
**Last updated:** 2025-01-15
**Owner:** TTEOP Working Group

This document lists all decisions that have been analyzed and proposed but **not yet approved**. Each decision blocks one or more backlog items (see `BACKLOG-30-60-90.md`). Decisions are identified by `UD-N` IDs and must not be reused.

**Approval roles:**
- **Founder** — DREP1 / project founder (sole decision authority at v0.1 stage)
- **Founder + Legal** — Founder decision with legal counsel review required before action
- **Founder + Community** — Founder decision with working-group consensus sought

---

## UD-1: Protocol name

**Title:** Finalize the protocol name as "TTEOP"

**Description:** The specification is currently circulated under the working name "TTEOP" (Token Telemetry Evaluation Operator Protocol). This name is neutral, pronounceable, and does not reference any commercial product. It has not been formally approved, and no trademark clearance has been performed. The name appears in the spec, schema, conformance runner, and all external communications, so an unapproved name creates accumulating rework risk.

**Options analyzed:**
1. **Adopt "TTEOP" as the final name.** Neutral, short, acronym-friendly. Requires trademark search. Risk: collision with existing use in unrelated domains.
2. **Adopt a descriptive name (e.g., "Token Efficiency Protocol", "TEP").** Lower collision risk but less distinctive; harder to search for.
3. **Retain a temporary internal codename and defer naming to v0.5.** Eliminates near-term rework but blocks marketing, TEP-0001, and trademark filing.

**Recommendation:** Option 1 — adopt "TTEOP" as the final name, contingent on trademark clearance.

**Rationale:** The name is already in use across artifacts and external discussions. Reverting creates rework and community confusion. A trademark search should be commissioned immediately; if clear, the name is locked via TEP-0001.

**Impact of delay:** Spec uses a temporary name; marketing materials cannot be finalized; TEP-0001 (backlog item 3.2) is blocked; trademark filing (UD-9) cannot proceed.

**Who must approve:** Founder (with trademark clearance from legal counsel).

---

## UD-2: 10xDEV rename

**Title:** Rename `10xDEV` to `log_leverage` in the normative core, retaining `10xDEV` as an application-profile alias

**Description:** The metric currently named `10xDEV` carries a commercial-product connotation that conflicts with the protocol's neutrality goal. The proposed change splits the name into a neutral normative core name (`log_leverage`) and a product-facing alias (`10xDEV`) valid only within the SignalAF application profile. This changes a metric name that was previously treated as a frozen invariant, so it requires explicit founder sign-off.

**Options analyzed:**
1. **Rename to `log_leverage` in core; retain `10xDEV` as alias.** Cleanest separation of normative and product layers. Risk: existing integrations referencing `10xDEV` as canonical break.
2. **Keep `10xDEV` as the normative name.** No breakage but perpetuates product coupling in an open standard, undermining neutrality.
3. **Use a different neutral name (e.g., `leverage_ratio`).** `log_leverage` is preferred because it encodes the log-transform in the name, reducing misuse.

**Recommendation:** Option 1 — `log_leverage` as normative, `10xDEV` as alias.

**Rationale:** An open standard cannot embed a commercial product name in its normative core. The alias mechanism preserves backward compatibility while moving the canonical name to neutral territory. The log-transform is part of the metric's definition, so encoding it in the name reduces accidental misuse by implementers who assume linearity.

**Impact of delay:** Naming tension with the existing SignalAF product persists; external contributors perceive the spec as product-coupled; metric registry (backlog item 1.3) cannot be finalized with stable names.

**Who must approve:** Founder (changes a frozen invariant name).

---

## UD-3: SNR rename

**Title:** Rename `SNR` to `output_fraction` in the normative core

**Description:** The metric currently named `SNR` (signal-to-noise ratio) is a misnomer: it is a simple output-to-total-token fraction, not a true signal-to-noise ratio. The proposed normative name `output_fraction` is self-describing. As with UD-2, `SNR` was treated as a frozen invariant, so renaming requires founder approval.

**Options analyzed:**
1. **Rename to `output_fraction` in core; retain `SNR` as alias.** Accurate, neutral, self-documenting.
2. **Keep `SNR` as normative.** Preserves the name but perpetuates a scientifically misleading label.
3. **Rename to `signal_ratio`.** Still misleading; implies a noise component that is not modeled.

**Recommendation:** Option 1 — `output_fraction` as normative, `SNR` as alias.

**Rationale:** Correctness of naming matters for an open standard that expects third-party implementers. `output_fraction` is unambiguous and does not invoke a signal-processing concept the metric does not actually compute. The alias preserves backward compatibility.

**Impact of delay:** Metric registry (backlog item 1.3) cannot be finalized; implementers may build incorrect intuitions from the `SNR` label; conformance test vectors (1.4) reference the metric by name.

**Who must approve:** Founder (changes a frozen invariant name).

---

## UD-4: Upsilon (Υ) formula retention

**Title:** Retain the formula Υ = (R × O) / I² despite its scale dependency

**Description:** The composite metric Upsilon is defined as Υ = (R × O) / I², where R is reasoning depth, O is output tokens, and I is input tokens. The formula exhibits scale dependency: multiplying input and output by a constant changes the result non-linearly. Analysis concluded that the formula is still useful as a directional indicator but should not be presented as a scale-invariant efficiency measure. The proposal is to retain the formula unchanged, document the limitation explicitly, and add a non-normative note discouraging cross-context comparison of raw Υ values.

**Options analyzed:**
1. **Retain formula; document limitation.** Preserves the frozen invariant; honest about the limitation.
2. **Normalize the formula to remove scale dependency (e.g., Υ = (R × O) / I).** Changes the invariant; loses the quadratic input penalty that the metric is designed to express.
3. **Deprecate Υ entirely.** Removes the problem but loses a metric that implementers have requested.

**Recommendation:** Option 1 — retain formula, document limitation.

**Rationale:** The quadratic input penalty is intentional design, not a bug. The scale dependency is a consequence of that design choice. Removing it changes what the metric measures. Documenting the limitation is the correct response to a known property, not a defect.

**Impact of delay:** Frozen invariant remains ambiguous in the spec; implementers may misuse Υ for cross-context comparison without the documented caveat; metric registry (1.3) lacks the non-normative note.

**Who must approve:** Founder (confirmation that a frozen invariant is retained without modification).

---

## UD-5: Conformance certification program

**Title:** Whether to establish a paid conformance certification program

**Description:** The conformance runner is open-source and freely usable. The question is whether to layer a paid certification program on top, where implementations that pass conformance can purchase a "Certified TTEOP-Conformant" badge and listing. This has revenue implications and requires legal structure.

**Options analyzed:**
1. **Establish a paid certification program.** Potential revenue stream; provides marketing signal for adopters. Risk: creates a paywall perception around an open standard; requires legal entity and trademark protection (UD-9).
2. **Keep conformance free and self-asserted.** Maximizes openness; no revenue; no formal "certified" badge.
3. **Free conformance with optional paid audit.** Hybrid: self-assertion is free; a paid audit tier provides a verified badge.

**Recommendation:** Option 3 — free self-assertion with optional paid audit tier, deferred to post-v0.5.

**Rationale:** At v0.1 the priority is adoption, not monetization. A paywall (even optional) risks alienating early adopters. The hybrid model preserves openness while leaving a revenue path open once the standard has traction.

**Impact of delay:** No certification claims are possible until the program is defined; adopters cannot advertise conformance with a verifiable badge; trademark usage guidelines (backlog item 3.7) cannot define badge rules.

**Who must approve:** Founder + Legal review.

---

## UD-6: Foundation transfer timing

**Title:** When to approach a neutral foundation for governance transfer

**Description:** The protocol is currently product-owned (by SignalAF / the founder). The long-term goal is transfer to a neutral foundation. The question is timing: transferring too early risks transferring an unstable spec; transferring too late risks the standard being perceived as permanently product-coupled.

**Options analyzed:**
1. **Transfer at v0.5.** Premature; only one implementation exists; spec is still changing.
2. **Transfer at v1.0 with ≥2 conformant implementations.** Spec is stable; multiple implementers de-risk governance. This is the working-group consensus.
3. **Never transfer; remain product-owned with open governance.** Maximizes founder control; perpetuates neutrality concerns.

**Recommendation:** Option 2 — transfer at v1.0 contingent on ≥2 conformant implementations.

**Rationale:** Foundation transfer is irreversible and expensive. A stable spec (v1.0) plus demonstrated multi-implementer adoption is the minimum credible threshold. The foundation-readiness assessment (backlog item 3.6) prepares the ground without committing to a transfer date.

**Impact of delay:** Governance remains product-owned; foundation-readiness assessment (3.6) cannot be actioned; external adopters may hesitate due to governance uncertainty.

**Who must approve:** Founder (with working-group consensus).

---

## UD-7: Contribution model

**Title:** DCO (Developer Certificate of Origin) vs. CLA (Contributor License Agreement)

**Description:** The repository needs a contribution-sign-off policy before accepting external PRs. A DCO (`Signed-off-by:` line) is lightweight and familiar to kernel-style projects. A CLA provides broader IP grant but is heavier and discourages casual contributions.

**Options analyzed:**
1. **DCO only.** Lightweight; git-native; no legal-entity overhead. Sufficient for most open-source standards.
2. **CLA (individual + corporate).** Stronger IP grant; preferred by some foundations; higher friction.
3. **DCO now, CLA at foundation transfer.** Pragmatic: low friction today, upgrade if a foundation requires it.

**Recommendation:** Option 3 — adopt DCO now, revisit CLA at foundation transfer (UD-6).

**Rationale:** At v0.1 the priority is lowering the barrier to contribution. DCO is sufficient for IP provenance. If a foundation later requires a CLA, it can be introduced at transfer time without invalidating past DCO sign-offs.

**Impact of delay:** External contributions are blocked (CONTRIBUTING.md, backlog item 1.10, cannot be finalized); community growth is stalled; feedback window (2.3) cannot formally accept external PRs.

**Who must approve:** Founder + Legal review.

---

## UD-8: Security contact

**Title:** Temporary `security@signalaf.com` vs. a neutral security contact

**Description:** A security reporting address is required before publishing `SECURITY.md` (backlog item 3.3). The only currently available address is `security@signalaf.com`, which routes to a commercial entity. A neutral address (e.g., `security@tteop.dev` or a hosted disclosure platform) requires domain registration and infrastructure not yet in place.

**Options analyzed:**
1. **Use `security@signalaf.com` temporarily; migrate to neutral address post-v0.5.** Pragmatic; available now; carries commercial-association risk.
2. **Register `tteop.dev` and use `security@tteop.dev` immediately.** Neutral but requires domain registration, DNS, and mailbox setup before SECURITY.md can publish.
3. **Use a third-party disclosure platform (e.g., GitHub Security Advisories).** Neutral, free, integrated with the repo; limited to GitHub-hosted workflow.

**Recommendation:** Option 3 — use GitHub Security Advisories as the primary channel, with `security@signalaf.com` as a fallback during v0.1.

**Rationale:** GitHub Security Advisories are neutral, free, and integrated with the existing repository. They avoid the commercial-association problem without requiring new infrastructure. The fallback address is acceptable for v0.1 and can be retired once a neutral domain is registered.

**Impact of delay:** No `SECURITY.md` can be published (backlog item 3.3 blocked); security reports have no documented channel; responsible-disclosure expectations are unset.

**Who must approve:** Founder.

---

## UD-9: Trademark registration

**Title:** Whether to register "TTEOP" as a trademark

**Description:** If "TTEOP" is adopted as the final name (UD-1), the question arises whether to register it as a trademark (USPTO and/or international). Registration protects the name but incurs cost and requires a legal entity to hold the mark.

**Options analyzed:**
1. **Register "TTEOP" immediately (USPTO).** Protects the name before adoption broadens; cost ~$350–$2,500 plus attorney fees; requires holder entity.
2. **Defer registration until foundation transfer (UD-6).** Avoids near-term cost; risk of third-party registration in the interim.
3. **Do not register; rely on common-law unregistered-mark rights.** No cost; weaker protection; insufficient for a certification badge (UD-5).

**Recommendation:** Option 2 — defer registration until foundation transfer (UD-6). The founder's existing MO§ES™ trademark provides interim brand protection for the related ecosystem; TTEOP trademark registration is deferred to avoid near-term cost and entity-formation overhead until the specification reaches sufficient maturity for foundation transfer.

**Rationale:** The cost of registration is low relative to the risk of third-party capture, but the founder has elected to defer registration (recorded 2026-08-30) to avoid committing to a specific holding entity before the foundation transfer path is determined. The MO§ES™ trademark noted in `DISCLOSURES.md` provides interim brand coverage for the broader ecosystem. If a certification program (UD-5) is established, trademark registration will be revisited at that time.

**Impact of delay:** Name is unprotected; third parties could register the mark; trademark usage guidelines (backlog item 3.7) cannot be enforced; certification badge (UD-5) is blocked.

**Who must approve:** Founder + Legal review.

---

## UD-10: Open/closed boundary enforcement

**Title:** How to enforce that commercial products do not silently redefine open metrics

**Description:** The protocol defines an open/closed boundary: open metrics (the 5 in the registry) have fixed definitions that must not be redefined by any implementation, including commercial products. The question is how to detect and respond to silent redefinition — for example, a product shipping a metric named `log_leverage` with a different formula and not documenting the divergence.

**Options analyzed:**
1. **Conformance-only enforcement.** Rely on the conformance runner; products that fail C2-Metric-Computation are non-conformant. No active policing.
2. **Conformance + published divergence registry.** Products must either pass conformance or file a public divergence declaration. Silent divergence is a governance violation.
3. **Conformance + automated scanning.** Build a tool that scans public documentation/APIs for metric-name reuse with divergent formulas. High effort; questionable coverage.

**Recommendation:** Option 2 — conformance plus a public divergence registry, with silent divergence treated as a governance violation.

**Rationale:** Active scanning (option 3) is expensive and brittle. Pure conformance (option 1) does not address products that use the metric name without claiming conformance. A divergence registry creates a lightweight, transparent mechanism: either conform or declare. Silent divergence becomes a documented governance violation with clear consequences (e.g., removal from the adapter registry, public notice).

**Impact of delay:** Boundary violations are undetectable and unenforceable; the open/closed boundary is a stated invariant with no enforcement mechanism; adopters cannot trust that metric names have stable meanings across products.

**Who must approve:** Founder (policy decision with governance consequences).

---

## Summary

| ID | Title | Status | Approver | Date |
|----|-------|--------|----------|------|
| UD-1 | Protocol name | **RESOLVED — renamed to TTEOP** | Founder | 2026-08-30 |
| UD-2 | 10xDEV rename | **RESOLVED — ratified** | Founder | 2026-08-30 |
| UD-3 | SNR rename | **RESOLVED — ratified** | Founder | 2026-08-30 |
| UD-4 | Υ formula retention | **RESOLVED — ratified** | Founder | 2026-08-30 |
| UD-5 | Conformance certification program | **DEFERRED — offer all three when ready** | Founder + Legal | — |
| UD-6 | Foundation transfer timing | **DEFERRED — TSC governance deferred by founder** | Founder + Community | — |
| UD-7 | Contribution model (DCO vs CLA) | **RESOLVED — DCO permanent** | Founder | 2026-08-30 |
| UD-8 | Security contact | **RESOLVED — designated** | Founder | 2026-08-30 |
| UD-9 | Trademark registration | **DEFERRED — MO§ES™ trademark noted** | Founder + Legal | — |
| UD-10 | Open/closed boundary enforcement | **RESOLVED — passive now, divergence registry at v0.3+** | Founder | 2026-08-30 |

**All v0.1-blocking decisions resolved.** UD-5, UD-6, UD-9 deferred (not blocking v0.1-draft publication).

---

## Resolution log

### UD-1: Protocol name — RESOLVED (2026-08-30)
**Decision:** Renamed from "OTEP" (Operator Token Efficiency Protocol) to "TTEOP" (Token Telemetry Evaluation Operator Protocol). The "OTEP" acronym collided with OpenTelemetry Enhancement Proposals (same industry). "TTEOP" has no search overlaps. Full repo rename completed: version strings (`tteop/0.1-draft`), schema, spec, runner, integrations, Python package, governance docs, CI, examples, file names (`tteop-runner.mjs`, `tteop-validate.mjs`, `tteop.mjs`), directory (`oeps/` → `teps/`), TEP numbering (OEP → TEP). Legacy alias `sigrank/0.1-draft` preserved. No trademark clearance performed — name used provisionally per UD-9.

### UD-2: 10xDEV rename — RESOLVED (2026-08-30)
**Decision:** Ratified. `log_leverage` is the normative core name; `10xDEV` is retained as an application-profile alias. Already implemented across spec, schema, runner, and all integrations.

### UD-3: SNR rename — RESOLVED (2026-08-30)
**Decision:** Ratified. `output_fraction` is the normative core name; `SNR` is retained as an application-profile alias. Already implemented.

### UD-4: Upsilon (Υ) formula retention — RESOLVED (2026-08-30)
**Decision:** Ratified. `(cache_read × output) / input²` is the canonical Yield formula. Frozen MOSES seed invariant Υ 18436.98 preserved.

### UD-5: Conformance certification program — DEFERRED
**Decision:** Deferred by founder. When revisited, all three options (paid certification, free self-assertion, free + paid audit hybrid) will be offered. Not blocking v0.1-draft publication.

### UD-6: Foundation transfer timing — DEFERRED
**Decision:** Deferred by founder. TSC governance transition is deferred until the project reaches sufficient maturity. Lead Maintainer arrangement (§2.1 of GOVERNANCE.md) remains in effect.

### UD-7: Contribution model (DCO vs CLA) — RESOLVED (2026-08-30)
**Decision:** DCO (Developer Certificate of Origin) adopted permanently. No CLA planned. Contributors sign off commits with `Signed-off-by: Name <email>`. No copyright assignment. Lightweight, no paperwork beyond the sign-off line. This is the same model used by Linux, Git, and many large open-source projects.

### UD-8: Security contact — RESOLVED (2026-08-30)
**Decision:** Security contact designated as Deric J McHenry. Contact: `deric.mchenry@gmail.com` or `hello@signalaf.com`. Business address: 84 W Utica St, Buffalo, NY 14299. Updated in `SECURITY.md`.

### UD-9: Trademark registration — DEFERRED
**Decision:** Deferred by founder. Note: MO§ES™ carries an existing trademark claim. No trademark registration for "TTEOP" at this time. Trademark status for "TTEOP" remains "no clearance performed" per DISCLOSURES.md.

### UD-10: Open/closed boundary enforcement — RESOLVED (2026-08-30)
**Decision:** Passive enforcement (conformance-only) for v0.1. Products that fail conformance are non-conformant. No active policing at this stage. A public divergence registry is planned for v0.3+ once there are 2+ third-party implementations to track. Automated scanning rejected as expensive and brittle.

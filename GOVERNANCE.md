# OTEP Governance and OEP Process

**Protocol:** OTEP (Operator Token Efficiency Protocol)
**Document status:** Active — governs the `otep/0.1-draft` specification and all subsequent versions
**Legacy alias:** `sigrank/0.1-draft` (backward-compatible; see `SPEC.md` §1)

---

## Conformance Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in **IETF BCP 14** [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals.

Normative governance requirements in this document carry stable requirement IDs of the form `SRP-GOV-NNN`. These IDs are permanent; once assigned they MUST NOT be renumbered or reused, even if the requirement text is amended. A `SRP-GOV-NNN` identifier is normative only within this governance document and does not constrain implementers of the OTEP protocol itself; it constrains maintainers and contributors to the specification.

---

## 1. Current State

**SRP-GOV-001:** The OTEP specification is currently maintained inside the SigRank ecosystem while the v0.x draft is being stabilized. During this period the repository, issue tracker, and release authority are administered by the SigRank project.

**SRP-GOV-002:** The current specification version is `otep/0.1-draft`, maturity `experimental`. No representation is made that OTEP has achieved formal standardization, ISO/IEC recognition, or universal interoperability.

**SRP-GOV-003:** During v0.x draft stabilization, the Lead Maintainer holds release authority. This is an interim arrangement intended to terminate upon establishment of a Technical Steering Committee (see §3). The interim arrangement MUST be documented in every published release note.

**SRP-GOV-004:** All specification artifacts — normative text, schemas, test vectors, conformance suites, and OEPs — MUST be developed in the open using the public repository and issue tracker. Private specification edits MUST NOT be merged into a published release without a corresponding public record.

---

## 2. Maintainer Roles

### 2.1 Lead Maintainer

**SRP-GOV-005:** There MUST be exactly one Lead Maintainer at any given time. The Lead Maintainer is responsible for:

1. Release authority for specification versions during the v0.x interim.
2. Final tie-break on contested OEPs when consensus cannot be reached (see §5).
3. Maintaining the contributor roster and reviewer roster.
4. Ensuring conflict-of-interest disclosures are current (see §4).
5. Publishing meeting summaries and decision logs.

**Interim Lead Maintainer (v0.1-draft):** Deric (DREP1), appointed 2026-08-28 at repository establishment. Commercial affiliation: founder of SignalAF/SigRank (reference implementation). See `DISCLOSURES.md` for the full disclosure record. This appointment is interim and terminates upon TSC establishment (SRP-GOV-009).

The Lead Maintainer MUST NOT unilaterally merge a normative OEP that has not completed its review window (see §7). The Lead Maintainer MAY merge non-normative, editorial, or documentation changes without a formal OEP.

### 2.2 Contributors

**SRP-GOV-006:** A Contributor is any individual who submits a pull request, issue, OEP draft, or review comment to the OTEP repository. Contributors MUST sign off their contributions under the Developer Certificate of Origin (see §13). Contributors do not hold release authority.

### 2.3 Reviewers

**SRP-GOV-007:** Reviewers are Contributors granted merge approval rights on non-normative changes and review responsibilities on OEPs. A Reviewer MUST be appointed by the Lead Maintainer (during v0.x) or the TSC (post-v0.5). Reviewers MUST recuse themselves from reviewing OEPs where they have an undisclosed conflict of interest (see §4).

### 2.4 Advisory Board

**SRP-GOV-008:** An Advisory Board MAY be convened to provide non-binding guidance on direction, scope, and ecosystem concerns. Advisory Board members do not hold vote or release authority. Advisory Board membership MUST be publicly listed with affiliations disclosed.

---

## 3. Technical Steering Committee Transition

**SRP-GOV-009:** A Technical Steering Committee (TSC) SHALL be established no later than the release of `otep/0.5`. The TSC assumes release authority and tie-break responsibility from the Lead Maintainer upon its establishment.

**SRP-GOV-010:** The TSC MUST consist of at least three and at most seven voting members. At least one voting member MUST be independent of any single commercial sponsor of OTEP tooling. TSC membership MUST be publicly listed with conflict-of-interest disclosures (see §4).

**SRP-GOV-011:** Establishment criteria for the TSC — all of the following MUST be satisfied:

1. Specification has reached at least `otep/0.5` with no open normative contradictions.
2. At least two independent Reviewers are active and have been for at least 90 days.
3. At least five OEPs have completed the full lifecycle (§6) under the interim process.
4. A documented charter has been published and ratified by the existing maintainer set.

Until these criteria are met, the Lead Maintainer arrangement (§2.1) remains in effect.

**SRP-GOV-012:** The Lead Maintainer role, once the TSC is established, becomes a non-voting chair or is dissolved at the TSC's discretion. The TSC MAY retain the Lead Maintainer as a voting member by majority vote.

---

## 4. Conflict-of-Interest Disclosure

**SRP-GOV-013:** Every Lead Maintainer, Reviewer, TSC member, and Advisory Board member MUST disclose all commercial affiliations relevant to OTEP — including but not limited to employment, consulting relationships, equity holdings, and commercial product relationships (e.g., any relationship to SignalAF or any other vendor of OTEP-compatible tooling).

**SRP-GOV-014:** Disclosures MUST be recorded in a public `DISCLOSURES.md` file in the repository and MUST be updated within 30 days of any material change. A disclosure is material if a reasonable observer could perceive it as influencing the individual's positions on OEPs.

**SRP-GOV-015:** A maintainer with a disclosed conflict of interest MAY participate in discussions but MUST recuse from voting or final-approval decisions on OEPs where the conflict is directly relevant. Recusal MUST be recorded in the decision log for that OEP.

**SRP-GOV-016:** Failure to disclose a material commercial affiliation within 60 days of appointment or change is grounds for removal from any maintainer role. Removal under this clause requires Lead Maintainer action (pre-TSC) or a two-thirds TSC vote (post-TSC).

---

## 5. Decision Process

**SRP-GOV-017:** The OTEP decision process is consensus-seeking. The default mode of decision-making is rough consensus among active Reviewers and the Lead Maintainer (or TSC, once established).

**SRP-GOV-018:** Rough consensus is achieved when no Reviewer raises a sustained objection after the full review window has elapsed and at least one Reviewer has explicitly endorsed the proposal. A sustained objection is one that is articulated with technical rationale and not withdrawn after discussion.

**SRP-GOV-019:** If rough consensus cannot be reached within the review window plus a 7-day extension, the decision falls to a maintainer vote. Pre-TSC, the voting body is the Lead Maintainer plus all active Reviewers. Post-TSC, the voting body is the TSC. A simple majority of non-recused voting members is required for acceptance; ties are broken by the Lead Maintainer (pre-TSC) or the TSC chair (post-TSC).

**SRP-GOV-020:** Escalation. Any Contributor may request escalation of a contested decision to the Advisory Board for non-binding review. The Advisory Board MUST issue written guidance within 14 days; this guidance is advisory only and does not override the maintainer vote outcome.

**SRP-GOV-021:** Every decision — accepted, rejected, or escalated — MUST be recorded in the OEP's status log with the date, decision, voters, recusals, and rationale summary.

---

## 6. OEP Lifecycle

An **OEP (OTEP Extension Proposal)** is the unit of change for the OTEP specification. OEPs are the successor mechanism to the earlier RFC process (`rfc/RFC-0001.md`); new proposals MUST use the OEP format.

**SRP-GOV-022:** OEP status states are defined as follows:

| State | Meaning |
|-------|---------|
| `draft` | Author is preparing the proposal; not yet submitted for review. |
| `review` | Proposal has been submitted and is within its review window. |
| `accepted` | Proposal has met decision criteria and is queued for implementation. |
| `rejected` | Proposal has been declined; rationale recorded. |
| `withdrawn` | Author has withdrawn the proposal before a decision. |
| `implemented` | Accepted proposal has landed in a published specification version. |
| `deferred` | Proposal is parked pending dependencies or future versions. |
| `superseded` | Proposal has been replaced by a later OEP. |

**SRP-GOV-023:** Lifecycle transitions MUST follow this order:

```text
draft → review → accepted → implemented
                 ↘ rejected
                 ↘ deferred → review (re-entered)
review → withdrawn
accepted/implemented → superseded (by a later OEP)
```

A proposal MUST NOT enter `review` without an assigned OEP number and a populated template (see §14). A proposal MUST NOT enter `accepted` without completing its review window (see §7) and a recorded decision (see §5).

**SRP-GOV-024:** Every OEP MUST be assigned a sequential, zero-padded number (`OEP-NNNN`) upon entering `review`. Numbers are permanent and MUST NOT be reused.

**SRP-GOV-025:** An `accepted` OEP MUST be implemented within a tracked milestone. If no implementation lands within 12 months of acceptance, the OEP status reverts to `deferred` and MUST be re-justified before re-entering `review`.

---

## 7. Review Windows

**SRP-GOV-026:** The minimum review window for a **normative** OEP — one that changes conformance requirements, metric definitions, schema fields, or semantics — is **14 calendar days**. The window MUST NOT be shortened below 14 days for normative changes.

**SRP-GOV-027:** The minimum review window for a **non-normative** OEP — one that changes only editorial text, examples, documentation, or non-binding guidance — is **7 calendar days**.

**SRP-GOV-028:** Review windows MAY be extended by the Lead Maintainer (or TSC) at any time before expiry. Extensions MUST be announced on the proposal's issue thread with a new closing date.

**SRP-GOV-029:** A proposal's classification as normative or non-normative MUST be stated by the author in the OEP template and MUST be confirmed by a Reviewer before the review window opens. Disputes over classification are resolved by the Lead Maintainer (pre-TSC) or TSC chair (post-TSC); the more restrictive window applies until resolved.

---

## 8. Appeals

**SRP-GOV-030:** Any Contributor may appeal a `rejected` OEP within **30 calendar days** of the rejection decision. An appeal MUST be filed as a new issue referencing the rejected OEP number and MUST include either (a) new technical evidence not available at decision time, or (b) a documented procedural error in the original decision.

**SRP-GOV-031:** Appeals are heard by a body distinct from the original decision-makers where feasible. Pre-TSC, the Lead Maintainer designates a Reviewer who did not vote on the original decision to lead the appeal review. Post-TSC, the TSC assigns a panel of at least two non-recused members.

**SRP-GOV-032:** The appeal review window is **14 calendar days**. Outcomes are: `upheld` (rejection stands), `overturned` (OEP returns to `review` with a fresh window), or `remanded` (OEP returns to `draft` for revision). The outcome MUST be recorded in the OEP status log.

**SRP-GOV-033:** An OEP that has been upheld on appeal MAY be resubmitted as a new OEP only if the author provides materially different content or evidence. Resubmission of an upheld OEP without material change is out of order.

---

## 9. Security Exception Handling

**SRP-GOV-034:** A **security-related OEP** is one that addresses a vulnerability, integrity-bypass, spoofing of provenance levels, or any defect that could cause a conforming implementation to emit misleading telemetry. Security-related OEPs MAY use an expedited process.

**SRP-GOV-035:** The expedited process reduces the normative review window from 14 days to a minimum of **72 hours**, provided ALL of the following hold:

1. The Lead Maintainer (or TSC chair) certifies in writing that the change addresses an active security concern.
2. At least two Reviewers have reviewed and endorsed the change within the 72-hour window.
3. The change is scoped to the security fix and does not bundle unrelated normative edits.

**SRP-GOV-036:** If any of the conditions in SRP-GOV-035 are not met, the standard review window (§7) applies. The expedited window MUST NOT be used to bypass disclosure or conflict-of-interest requirements (§4).

**SRP-GOV-037:** Security-related OEPs SHOULD be discussed in a private channel until a fix is ready for public review, to avoid disclosing exploitable details prematurely. Once a fix is published, the private discussion summary MUST be appended to the public OEP record.

---

## 10. Versioning

**SRP-GOV-038:** The OTEP specification uses semantic versioning with the form `MAJOR.MINOR-PATCH` adapted for drafts. During the v0.x series, the version string is `otep/0.MINOR-draft` (e.g., `otep/0.1-draft`). Upon reaching v1.0, the string becomes `otep/MAJOR.MINOR.PATCH`.

**SRP-GOV-039:** Version increment rules:

1. **MAJOR** — breaking changes to normative conformance requirements, metric semantics, or schema structure. Requires a major-version increment.
2. **MINOR** — backward-compatible additions or non-breaking refinements.
3. **PATCH** — editorial, clarifying, or errata fixes that do not alter conformance semantics.
4. **draft suffix** — indicates the version is not yet stable; breaking changes MAY occur between minor versions without a major increment while the `-draft` suffix is present.

**SRP-GOV-040:** A feature marked `experimental` MAY change between minor versions while the `-draft` suffix is present. A feature marked `stable` MUST NOT change semantically within its declared major version except via a major-version increment.

**SRP-GOV-041:** Deprecation policy. A deprecated feature MUST be retained for at least **one full version increment** (minor or major) before removal. The deprecation MUST be announced in the release notes of the version in which deprecation begins and MUST reference the replacement, if any. Removal of a deprecated feature requires a major-version increment.

**SRP-GOV-042:** Every published version MUST be tagged in the repository and accompanied by a `CHANGELOG.md` entry. The changelog MUST distinguish normative changes from non-normative changes.

---

## 11. Trademark and Certification Governance

**SRP-GOV-043:** The name "OTEP" and "Operator Token Efficiency Protocol" are used to identify the specification. During the v0.x interim, the SigRank project holds administrative custody of the name. Use of the OTEP name to claim conformance MUST be backed by passing the published conformance tests in `conformance/`.

**SRP-GOV-044:** No party MAY represent an implementation as "OTEP-conformant" or "OTEP-certified" unless it passes the current published conformance suite for the claimed version. Self-asserted conformance without test evidence is a violation of this requirement.

**SRP-GOV-045:** If a certification mark is established in the future, the mark MUST be governed by published, version-pinned test criteria. Certification criteria MUST NOT reference unpublished, proprietary, or secret tests. Any certification program MUST be administered under terms no less open than the specification license.

**SRP-GOV-046:** Reference implementations, leaderboards, and commercial products (including SignalAF) MAY use the OTEP name to describe interoperability, but MUST NOT imply endorsement by the specification maintainers unless explicitly granted in writing.

---

## 12. Conditions for Transferring to a Neutral Foundation

**SRP-GOV-047:** Transfer of the OTEP specification to a neutral foundation (e.g., a standards body or open governance foundation) is a stated goal but is NOT guaranteed. This document does not assume that any foundation will accept custody. Transfer is conditional on all of the following readiness criteria being satisfied:

1. **(a) v1.0 stable.** The specification MUST have reached `otep/1.0` with `stable` maturity and no open normative contradictions.
2. **(b) 2+ independent implementations.** At least two independent implementations MUST exist and pass the v1.0 conformance suite. "Independent" means developed by distinct organizations or unaffiliated individuals, not sharing a common codebase.
3. **(c) 6+ months of stable governance.** The TSC (§3) MUST have been operational for at least six months with a documented record of decisions, and no unresolved governance disputes.
4. **(d) Community agreement.** A supermajority (two-thirds) of active Reviewers and TSC members MUST vote in favor of transfer. The vote MUST be recorded publicly.
5. **(e) No blocking IP issues.** A documented IP review MUST confirm no blocking patent, trademark, or copyright claims. All contributor inbounds MUST be under the repository license with DCO sign-off (§13).

**SRP-GOV-048:** If any criterion in SRP-GOV-047 is not met, transfer MUST NOT proceed. Failure to transfer does not impair the validity of the specification under interim governance; the specification remains usable under its open license regardless of governance location.

**SRP-GOV-049:** A foundation accepting transfer MUST agree in writing to (1) preserve the open license, (2) maintain the OEP process or an equivalent open process, (3) preserve stable requirement IDs, and (4) not impose proprietary conformance criteria. If no foundation satisfies these terms, the specification remains under TSC governance indefinitely.

---

## 13. Contribution Model Comparison

Three contribution models were considered for OTEP:

| Model | Mechanism | Barrier | Copyright | Legal review |
|-------|-----------|---------|-----------|--------------|
| **CLA** (Contributor License Agreement) | Signed agreement granting broad license/patent grants to the project | Higher — individual legal sign-off or corporate CLA required | Some CLAs require copyright assignment | Required — CLA text needs legal review before adoption |
| **DCO** (Developer Certificate of Origin) | `Signed-off-by:` line on each commit attesting to origin | Lower — no separate agreement; built into git workflow | No copyright assignment; contributor retains copyright, grants license under existing project license (Apache 2.0) | Minimal — DCO is a well-established, reviewed text |
| **No agreement** | No sign-off or agreement | Lowest | None beyond default git authorship | None — but weakest IP provenance; not recommended for a spec intended for neutral transfer |

**SRP-GOV-050:** OTEP adopts the **Developer Certificate of Origin (DCO)**, version 1.1. Every commit merged to a release branch MUST contain a `Signed-off-by:` line by the author attesting to the DCO terms.

**SRP-GOV-051:** Rationale for DCO over alternatives:

1. **Lower barrier.** DCO requires no separate agreement beyond a commit trailer, reducing friction for casual and corporate contributors alike.
2. **No copyright assignment.** Contributors retain their copyright; the project receives only the license grant already provided by the repository license (Apache 2.0). This is compatible with the goal of neutral transfer (§12), which requires clean inbounds without assigned copyright.
3. **Apache 2.0 compatibility.** DCO is the standard sign-off mechanism for Apache 2.0–licensed projects and aligns with the OTEP repository license.
4. **Sufficient provenance.** DCO provides auditable origin attestation adequate for the IP review required by SRP-GOV-047(e).

**SRP-GOV-052:** A CLA is NOT adopted. Adopting a CLA would require legal review of the agreement text, introduce a higher contribution barrier, and risk copyright-assignment terms that complicate neutral transfer. A CLA MAY be revisited only if a future foundation transfer (§12) requires it, and only after legal review and community vote.

**SRP-GOV-053:** The "no agreement" model is explicitly rejected. It provides insufficient IP provenance for a specification intended to outlive its founding organization and would fail the IP-review criterion of SRP-GOV-047(e).

---

## 14. OEP Template

**SRP-GOV-054:** Every OEP MUST use the template at `oeps/OEP-0000.md`. The template is the canonical, numbered placeholder (`OEP-0000`) reserved as the template and MUST NOT be assigned to a real proposal.

**SRP-GOV-055:** The template MUST include, at minimum, the following sections:

1. **Title** — concise proposal name.
2. **OEP number** — assigned on entry to `review` (§6).
3. **Author(s)** and **Reviewer(s)**.
4. **Status** — one of the states in SRP-GOV-022.
5. **Classification** — `normative` or `non-normative` (§7).
6. **Summary** — one-paragraph abstract.
7. **Motivation** — the problem being addressed.
8. **Specification changes** — concrete, diff-style description of normative edits.
9. **Rationale** — why this approach over alternatives.
10. **Backward compatibility** — impact on existing conformant implementations.
11. **Conformance impact** — which conformance classes or test vectors are affected.
12. **Security considerations** — per §9, even if "none".
13. **Disclosure** — author affiliations relevant to the proposal (§4).
14. **Resolution** — decision record, filled in on `accepted`/`rejected`.

**SRP-GOV-056:** An OEP submitted without all required template sections populated MUST be returned to `draft` status until complete. Reviewers MUST NOT open a review window on an incomplete OEP.

---

## Normative References

| Reference | Document |
|-----------|----------|
| [RFC 2119] | Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997 |
| [RFC 8174] | Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017 |
| [DCO 1.1] | Developer Certificate of Origin, version 1.1, https://developercertificate.org/ |

---

## Requirement ID Index

| ID | Topic |
|----|-------|
| SRP-GOV-001 | Current state: SigRank ecosystem custody |
| SRP-GOV-002 | Current version and maturity |
| SRP-GOV-003 | Interim Lead Maintainer release authority |
| SRP-GOV-004 | Open development requirement |
| SRP-GOV-005 | Lead Maintainer responsibilities |
| SRP-GOV-006 | Contributor definition and DCO |
| SRP-GOV-007 | Reviewer appointment and recusal |
| SRP-GOV-008 | Advisory Board scope |
| SRP-GOV-009 | TSC establishment deadline |
| SRP-GOV-010 | TSC composition and independence |
| SRP-GOV-011 | TSC establishment criteria |
| SRP-GOV-012 | Lead Maintainer role post-TSC |
| SRP-GOV-013 | Conflict-of-interest disclosure scope |
| SRP-GOV-014 | Disclosure recording and updates |
| SRP-GOV-015 | Recusal on conflicted OEPs |
| SRP-GOV-016 | Non-disclosure removal grounds |
| SRP-GOV-017 | Consensus-seeking default |
| SRP-GOV-018 | Rough consensus definition |
| SRP-GOV-019 | Maintainer vote fallback |
| SRP-GOV-020 | Escalation to Advisory Board |
| SRP-GOV-021 | Decision log requirement |
| SRP-GOV-022 | OEP status states |
| SRP-GOV-023 | OEP lifecycle transitions |
| SRP-GOV-024 | OEP numbering |
| SRP-GOV-025 | Implementation deadline |
| SRP-GOV-026 | Normative review window (14 days) |
| SRP-GOV-027 | Non-normative review window (7 days) |
| SRP-GOV-028 | Window extensions |
| SRP-GOV-029 | Normative classification |
| SRP-GOV-030 | Appeal filing window |
| SRP-GOV-031 | Appeal review body |
| SRP-GOV-032 | Appeal outcomes |
| SRP-GOV-033 | Resubmission after upheld appeal |
| SRP-GOV-034 | Security OEP definition |
| SRP-GOV-035 | Expedited process conditions |
| SRP-GOV-036 | Expedited fallback to standard window |
| SRP-GOV-037 | Private security discussion |
| SRP-GOV-038 | Version string format |
| SRP-GOV-039 | Version increment rules |
| SRP-GOV-040 | Experimental vs stable feature change rules |
| SRP-GOV-041 | Deprecation policy (1 version notice) |
| SRP-GOV-042 | Version tagging and changelog |
| SRP-GOV-043 | OTEP name and conformance backing |
| SRP-GOV-044 | Conformance claim requires test evidence |
| SRP-GOV-045 | Certification mark governance |
| SRP-GOV-046 | No implied endorsement |
| SRP-GOV-047 | Foundation transfer readiness criteria |
| SRP-GOV-048 | Transfer blocked if criteria unmet |
| SRP-GOV-049 | Foundation acceptance terms |
| SRP-GOV-050 | DCO adoption |
| SRP-GOV-051 | DCO rationale |
| SRP-GOV-052 | CLA not adopted; revisit conditions |
| SRP-GOV-053 | No-agreement model rejected |
| SRP-GOV-054 | OEP template reference |
| SRP-GOV-055 | OEP template required sections |
| SRP-GOV-056 | Incomplete OEP returned to draft |

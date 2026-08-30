# TTEOP Reopening and Maintenance Charter

**Protocol:** TTEOP (Token Telemetry Evaluation Operator Protocol)
**Document status:** Active — governs when and how the TTEOP specification may be reopened after closure
**Companion to:** `GOVERNANCE.md` (roles, TEP lifecycle, decision process), `OPEN-COMMERCIAL-BOUNDARY.md` (open/commercial boundary)
**Established:** 2026-08-30 (founder decision, concurrent with v0.1.5-draft release)

---

## Conformance Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in **IETF BCP 14** [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals.

Normative requirements in this document carry stable requirement IDs of the form `SRP-GOV-NNN`, continuing the sequence from `GOVERNANCE.md` (which ends at `SRP-GOV-056`). These IDs are permanent; once assigned they MUST NOT be renumbered or reused. A `SRP-GOV-NNN` identifier in this document constrains maintainers and contributors to the specification, not implementers of the TTEOP protocol itself.

---

## 1. Purpose

TTEOP exists to provide a minimal, vendor-neutral and citable interchange protocol for AI-operator token telemetry.

It standardizes:

- `input`
- `output`
- `cache_write`
- `cache_read`
- Derived metric calculations
- Missingness and normalization behavior
- Privacy and provenance declarations
- Canonical telemetry envelopes
- Conformance requirements

TTEOP's purpose is interoperability. It allows different tools to produce, validate and exchange the same telemetry without depending on SignalAF, SigRank or any individual vendor.

## 2. Primary goals

**SRP-GOV-057:** TTEOP SHALL:

1. Remain small, deterministic and implementable.
2. Preserve compatibility across conforming implementations.
3. Produce testable and unambiguous requirements.
4. Maintain stable schemas, formulas and test vectors.
5. Reject malformed, misleading or ambiguous telemetry.
6. Preserve privacy, provenance and non-inference safeguards.
7. Maintain an immutable, citable release history.
8. Keep the open protocol separate from commercial benchmarking, rankings and enterprise services.

## 3. Non-goals

TTEOP does not exist to:

- Prove developer productivity.
- Claim that token efficiency causes business outcomes.
- Rank operators or organizations.
- Contain proprietary SigRank thresholds or anti-gaming systems.
- Absorb every possible AI metric.
- Support speculative provider features before they exist.
- Become a general-purpose observability platform.
- Add integrations merely to create activity.
- Pursue standards bodies without demonstrated need.
- Generate endless review and remediation cycles.

## 4. Valid reopening triggers

**SRP-GOV-058:** The project MAY be reopened only when at least one of the conditions in this section exists. Reopening without a valid trigger is prohibited.

### A. Confirmed correctness defect

A reproducible case shows that the specification, schema, builder, validator or conformance suite produces an incorrect or contradictory result.

Required evidence:

- Minimal failing example
- Applicable requirement ID
- Expected and actual behavior
- Regression test

### B. Security or privacy vulnerability

A credible issue could permit:

- Sensitive-data exposure
- Identity leakage
- Invalid provenance claims
- Signature misrepresentation
- Unsafe parsing
- Ambiguous telemetry interpretation
- Bypass of privacy-mode requirements

**SRP-GOV-059:** Security and privacy issues receive immediate priority over all other reopening triggers.

### C. Real interoperability failure

Two implementations following the published specification produce incompatible results.

Required evidence:

- Both implementation versions
- Shared input
- Divergent outputs
- Relevant specification language
- Proposed test vector

### D. Provider telemetry change

A real provider introduces, removes or materially changes token telemetry in a way that cannot be represented accurately by the existing four primitives or adapter model.

**SRP-GOV-060:** A provider-specific difference SHOULD first be handled in an adapter. The core protocol changes only when the existing model is genuinely insufficient.

### E. Normative ambiguity

An implementer identifies language that permits multiple reasonable interpretations.

The ambiguity must be demonstrated with a concrete envelope, formula or conformance outcome.

### F. Deliberate new protocol version

The maintainer intentionally authorizes work on a new version because accumulated evidence justifies a compatible extension or breaking revision.

**SRP-GOV-061:** A new version is a business and governance decision. It is not automatically created because ideas exist in the backlog.

### G. External implementation proposal

A real implementer submits a specific interoperability requirement, implementation report or tested protocol proposal.

General interest, feature requests or hypothetical use cases are insufficient by themselves.

## 5. Invalid reopening reasons

**SRP-GOV-062:** The project MUST NOT be reopened solely because:

- A reviewer can think of additional polish.
- A new review tool produces minor stylistic suggestions.
- No code has changed since the previous review.
- Someone proposes an untested metric.
- A speculative integration might be useful someday.
- Download counts or social engagement are low.
- The project lacks formal ANSI, ISO or foundation status.
- No outside organization has adopted it yet.
- Documentation could be worded differently without changing meaning.
- Working code could be refactored into a preferred style.
- An optional roadmap item remains unfinished.
- A future commercial product has different requirements.

These items may be recorded in a backlog without reopening protocol development.

## 6. Reopening authorization

**SRP-GOV-063:** Before work begins, a short reopening record MUST be created containing:

- Trigger category
- Evidence
- Exact scope
- Affected requirements
- Compatibility risk
- Expected deliverables
- Acceptance criteria
- Authorized version target
- Explicit non-goals

**SRP-GOV-064:** Work outside the scope of an authorized reopening record requires a separate authorization.

## 7. Change classification

### Patch release

Use for:

- Correctness fixes
- Security fixes
- Documentation corrections
- Additional tests
- Non-breaking validator improvements
- Clarifications that do not change normative meaning

### Minor release

Use for:

- Backward-compatible schema extensions
- New adapters or profiles
- New optional fields
- New conformance capabilities
- New public APIs

### Major release

Use for:

- Breaking schema changes
- Formula changes
- Renamed or removed canonical fields
- Changed privacy semantics
- Incompatible version behavior

**SRP-GOV-065:** Normative minor and major changes require a TEP.

## 8. Required implementation process

**SRP-GOV-066:** Every reopened change MUST follow this sequence:

1. Record the trigger and scope.
2. Reproduce the issue.
3. Add or define the failing test.
4. Determine whether the change is normative.
5. Create a TEP when required.
6. Implement the smallest sufficient change.
7. Run the complete conformance suite.
8. Run one primary review.
9. Fix confirmed critical and major issues.
10. Run one focused fix review.
11. Publish a new immutable version when distribution changed.
12. Verify tag, commit, npm `gitHead`, GitHub release and DOI/archive lineage.
13. Close the reopening record.

## 9. Review stopping rule

**SRP-GOV-067:** Review must not become an infinite loop.

A reopening is complete when:

- Its original acceptance criteria pass.
- The full conformance suite is green.
- No confirmed critical or major issues remain.
- Published artifacts point to the same release commit.
- The working tree is clean.
- The completion record lists any deferred minor items.

**SRP-GOV-068:** Minor stylistic findings do not block closure unless they affect correctness, security, interoperability, privacy, provenance or release integrity.

**SRP-GOV-069:** Review tools may discover issues, but they do not independently expand project scope.

## 10. Release integrity

**SRP-GOV-070:** Published releases are immutable.

Never:

- Move an existing release tag.
- Rewrite a published release to include later changes.
- Replace the files associated with an established DOI.
- Reuse a published version number.
- Conceal a known defective version.

**SRP-GOV-071:** Corrections require a new version.

**SRP-GOV-072:** Every release MUST preserve this chain:

`source commit → annotated tag → CI evidence → GitHub release → npm gitHead → archival DOI`

## 11. Commercial boundary

The open TTEOP protocol includes:

- Specification
- Schemas
- Metric definitions
- Test vectors
- Reference implementations
- Conformance tooling
- Governance process

SignalAF and SigRank may separately own:

- Managed telemetry services
- Cohort benchmarking
- Proprietary rankings
- Anti-gaming systems
- Enterprise dashboards
- Accreditation services
- Support and SLAs
- Workflow and ROI analysis

**SRP-GOV-073:** Commercial requirements do not automatically become protocol requirements.

## 12. Current closure declaration

**SRP-GOV-074:** TTEOP is considered built and operationally closed when its current release is:

- Implemented
- Tested
- Published
- Versioned
- Citable
- Archived
- Reproducible
- Free of confirmed critical and major defects

**SRP-GOV-075:** Once closed, no action is required until a valid reopening trigger occurs.

**SRP-GOV-076:** A roadmap is not an obligation. Optional future opportunities remain optional until explicitly authorized.

---

## Requirement ID Index

| ID | Section | Summary |
|---|---|---|
| SRP-GOV-057 | §2 | Primary goals (8 SHALL clauses) |
| SRP-GOV-058 | §4 | Reopening requires a valid trigger |
| SRP-GOV-059 | §4.B | Security/privacy issues receive immediate priority |
| SRP-GOV-060 | §4.D | Provider differences handled in adapters first |
| SRP-GOV-061 | §4.F | New version is a governance decision, not automatic |
| SRP-GOV-062 | §5 | Invalid reopening reasons (exhaustive list) |
| SRP-GOV-063 | §6 | Reopening record required before work begins |
| SRP-GOV-064 | §6 | Out-of-scope work requires separate authorization |
| SRP-GOV-065 | §7 | Normative minor/major changes require a TEP |
| SRP-GOV-066 | §8 | Required implementation process (13 steps) |
| SRP-GOV-067 | §9 | Review must not become an infinite loop |
| SRP-GOV-068 | §9 | Minor stylistic findings do not block closure |
| SRP-GOV-069 | §9 | Review tools do not expand project scope |
| SRP-GOV-070 | §10 | Published releases are immutable |
| SRP-GOV-071 | §10 | Corrections require a new version |
| SRP-GOV-072 | §10 | Release chain integrity (commit→tag→CI→release→npm→DOI) |
| SRP-GOV-073 | §11 | Commercial requirements do not become protocol requirements |
| SRP-GOV-074 | §12 | Closure declaration criteria (8 conditions) |
| SRP-GOV-075 | §12 | No action required until valid trigger |
| SRP-GOV-076 | §12 | Roadmap is not an obligation |

---

## Normative References

- **RFC 2119** — Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", March 1997.
- **RFC 8174** — Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", May 2017.
- `GOVERNANCE.md` — TTEOP governance, roles, TEP lifecycle, decision process (SRP-GOV-001 through SRP-GOV-056).
- `OPEN-COMMERCIAL-BOUNDARY.md` — open/commercial boundary matrix.
- `SPEC.md` — TTEOP protocol specification (SRP-* requirement IDs).

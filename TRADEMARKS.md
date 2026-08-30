# Trademark Usage Guidelines

**Document status:** Normative
**Spec version:** tteop/0.1-draft

---

## 1. Protocol Name

"TTEOP" and "Token Telemetry Evaluation Operator Protocol" are the proposed names for this specification.

**[REQUIRES LEGAL REVIEW (UD-9 deferred)]** — Trademark availability and registration status have not been formally cleared. See `UNRESOLVED-DECISIONS.md` §9.

Until trademark registration is completed:
- "TTEOP" is used as a descriptive name, not as a claimed trademark
- No party should claim exclusive rights to "TTEOP" until registration is complete
- All parties MAY use "TTEOP" to refer to the specification

## 2. Compatibility and Conformance Claims

### Permitted claims (when conformance tests pass)

| Claim | Condition |
|-------|-----------|
| "TTEOP Compatible — v0.1-draft" | System emits valid envelopes and preserves I/O/W/R semantics |
| "TTEOP Producer Conformant — v0.1-draft" | Passes Producer conformance class |
| "TTEOP Consumer Conformant — v0.1-draft" | Passes Consumer conformance class |
| "TTEOP Adapter Conformant — v0.1-draft (provider: X)" | Passes Adapter conformance class for provider X |
| "TTEOP Metric-Engine Conformant — v0.1-draft" | Passes Metric-Engine conformance class |
| "TTEOP Privacy-Profile Conformant — v0.1-draft (mode: X)" | Passes Privacy-Profile conformance class for mode X |
| "TTEOP Full-Platform Conformant — v0.1-draft" | Passes all mandatory tests from all classes |

### Prohibited claims

| Claim | Reason |
|-------|--------|
| "TTEOP Conformant" (without class specification) | Must specify conformance class |
| "TTEOP Certified" | No certification program exists at v0.1 |
| "TTEOP Standard" | Not a formal standard |
| "ISO/IEC TTEOP" | No ISO/IEC recognition |
| "TTEOP Approved" | No approval body exists |

## 3. Certification Marks

**[REQUIRES LEGAL REVIEW (UD-9 deferred) + FOUNDER APPROVAL]**

If a certification program is established:
- "TTEOP Conformant" would be registered as a certification mark
- Certification would be based on published, open conformance tests
- Certification decisions would be appealable through a published process
- Payment for certification services MAY cover operational costs but MUST NOT purchase technical conformity
- A failed conformance test MUST NOT be overridable by payment

## 4. Legacy Name

"SigRank" and "SigRank Standard" are product names associated with SignalAF. They are NOT protocol names. The protocol name is "TTEOP." The legacy version string `sigrank/0.1-draft` is accepted as a backward-compatible alias but should not be used in new implementations.

## 5. Display Requirements

When displaying TTEOP compatibility or conformance claims:
- The claim MUST include the protocol version (e.g., "v0.1-draft")
- The claim MUST be accurate at the time of display
- The claim MUST be verifiable by running the published conformance tests
- The claim MUST NOT imply endorsement by any standards body

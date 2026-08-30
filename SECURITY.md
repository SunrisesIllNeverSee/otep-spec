# Security Considerations

**Document status:** Normative
**Spec version:** otep/0.1-draft

---

## 1. Threat Model

| Threat | Description | Severity | Mitigation |
|--------|-------------|----------|------------|
| Telemetry fabrication | Operator fabricates token counts to inflate metrics | High | Provenance levels, anomaly detection, signed envelopes (v0.2) |
| Identity leakage | Real-world identity exposed in pseudonymous records | High | Privacy mode rules, forbidden field validation, small-cell suppression |
| Content leakage | Prompt/completion text leaks into telemetry | Critical | Content independence rules, forbidden field names (SRP-VAL-006) |
| Replay attacks | Valid signed envelope replayed with modified timestamps | Medium | Signature covers timestamp (v0.2), nonce validation |
| Man-in-the-middle | Telemetry modified in transit | Medium | TLS transport, signed envelopes (v0.2) |
| Metadata inference | Token counts alone reveal sensitive behavior patterns | Low | Documented as known limitation; no v0.1 mitigation |
| Employee surveillance | Employers use metrics for surveillance | High | SRP-SEC-003/004, operator rights, opt-out |

## 2. Security Reporting Process

**`SRP-SEC-001`** Security vulnerabilities MUST be reported to the designated security contact:

- **Contact:** Deric J McHenry
- **Email:** `deric.mchenry@gmail.com` or `hello@signalaf.com`
- **Address:** 84 W Utica St, Buffalo, NY 14299
- **Acknowledgement:** within 48 hours (per SRP-SEC-002)
- **PGP key:** will be published at v0.5 for encrypted reports

Do NOT open public GitHub issues for security vulnerabilities.

**`SRP-SEC-002`** Security reports MUST be acknowledged within 48 hours and addressed within 90 days.

### Reporting guidelines

- Do NOT publicly disclose security vulnerabilities until a fix is available
- Include: description, reproduction steps, affected versions, suggested fix
- PGP key will be published at v0.5 for encrypted reports

## 3. Employee-Surveillance Misuse

**`SRP-SEC-003`** OTEP metrics MUST NOT be used as the sole basis for employment decisions (hiring, firing, promotion, compensation, performance review).

**`SRP-SEC-004`** Enterprise deployments MUST provide operators with:
- **Access:** Operators can view their own telemetry
- **Opt-out:** Operators can opt out of enterprise collection (with documented consequences)
- **Transparency:** Enterprises disclose what is collected, how it is used, and who has access
- **Deletion:** Operators can request deletion per SRP-PRIV-006

**Failure condition:** An enterprise deployment does not provide these operator rights.

## 4. Content Independence

**`SRP-SEC-005`** The OTEP protocol MUST NOT require collection of prompt text, completion text, source code, diffs, keystrokes, or screen contents.

**`SRP-SEC-006`** Implementations MUST validate that no forbidden field names (per SRP-VAL-006) are present in any envelope.

## 5. Signature and Integrity (v0.2 Preview)

v0.1 defines the signature envelope structure. v0.2 will specify:
- Mandatory algorithm: Ed25519 (recommended) or HMAC-SHA256
- Canonical serialization: JSON Canonical Form (JCS)
- Key distribution model
- Signature revocation process

Until v0.2, provenance level `signed` is valid but the signature algorithm is implementation-defined.

## 6. Privacy and Security Interaction

Privacy modes and security considerations interact:
- `public-pseudonymous` mode: No identity protection beyond pseudonymization; consumers MUST enforce small-cell suppression
- `private-managed-cohort` mode: Cohort membership is access-controlled
- `enterprise-isolated` mode: All data stays within enterprise boundary; no external transmission without consent

## 7. Known Limitations

1. **No replay protection at v0.1:** Signed envelopes (v0.2) will address this
2. **No key revocation at v0.1:** v0.2 will define revocation process
3. **Metadata inference:** Token counts alone can reveal patterns about operator behavior (e.g., working hours, task types). This is a known limitation with no v0.1 mitigation.
4. **Self-reported provenance:** Self-reported telemetry has no verification. Consumers MUST treat self-reported data with appropriate skepticism.

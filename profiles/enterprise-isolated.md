# Privacy Mode: Enterprise Isolated

**Privacy mode:** `enterprise-isolated`
**Authority:** Normative when adopted — see `REPOSITORY-ARCHITECTURE.md` §"Authority of Every Major Path".
**Spec reference:** SPEC.md §17.1, `SRP-PRIV-001` through `SRP-PRIV-008`, `SRP-SEC-003`, `SRP-SEC-004`.
**Conformance class:** Privacy-profile — see `conformance/classes.md`.

---

## 1. Purpose

The `enterprise-isolated` privacy mode governs telemetry envelopes that belong to a single enterprise tenant and must never leave that tenant's boundary without explicit consent. It supports on-premise and private-cloud deployments where the enterprise maintains full custody of operator telemetry, maps pseudonymous keys to internal identity internally, and prohibits any external data sharing.

This mode adds a tenant identifier so that consumers can scope all queries, aggregation, and retention to a single tenant. It is the strictest privacy mode with respect to external transmission.

---

## 2. Permitted Fields

An envelope in `enterprise-isolated` mode MAY include all OTEP telemetry and metadata fields, **including** a tenant identifier.

| Field group | Permitted | Notes |
|-------------|-----------|-------|
| `telemetry.input` | Yes | Required non-negative integer (`SRP-DATA-002`) |
| `telemetry.output` | Yes | Required non-negative integer (`SRP-DATA-003`) |
| `telemetry.cache_write` | Yes | Integer or null (`SRP-DATA-004`) |
| `telemetry.cache_read` | Yes | Integer or null (`SRP-DATA-005`) |
| `operator.pseudonymous_key` | Yes | Required — pseudonymous key only |
| Tenant identifier (in `extensions` namespaced, e.g., `extensions["com.enterprise.tenant_id"]`) | **Yes** | Required for tenant scoping |
| `observation.*` (timestamp, window) | Yes | Required RFC 3339 fields |
| `source.*` (tool, platform, provider, model, adapter) | Yes | Optional but recommended |
| `provenance.*` | Yes | Required level declaration |
| `validity.*` | Yes | Required status, flags |
| `extensions.*` (namespaced) | Yes | Subject to `SRP-EXT-003` |

The tenant identifier MUST be carried in a namespaced extension field (e.g., `extensions["com.acme.tenant_id"]`), never as a top-level real-world identity field. This keeps the base envelope schema stable while permitting tenant scoping.

---

## 3. Prohibited Fields

The following fields MUST NOT appear in an `enterprise-isolated` envelope.

| Prohibited field | Reason | Governing requirement |
|------------------|--------|------------------------|
| Real-world identity in the envelope (name, email, user handle, employee ID, OAuth subject) | Re-identification risk in the wire format | `SRP-DATA-011`, `SRP-VAL-002` item 6 |
| `operator.cohort_id` (non-null) | Cohort grouping is a separate mode; enterprise uses tenant scoping | Mode consistency |
| Prompt text, completion text, source code, diffs, keystrokes, screen contents | Content independence | `SRP-VAL-005`, `SRP-VAL-006` |

**Important distinction:** The enterprise MAY maintain an internal mapping from `operator.pseudonymous_key` to real-world identity (e.g., employee directory) **outside** the envelope. That mapping is enterprise-owned, never transmitted in the envelope, and never part of the OTEP wire format. The prohibition applies to the envelope only.

---

## 4. Identity Handling

An `enterprise-isolated` envelope carries `operator.pseudonymous_key` **plus** a tenant identifier (in a namespaced extension).

- The pseudonymous key MUST be a stable, opaque identifier. The enterprise mints it and maintains the internal mapping to real-world identity (e.g., employee ID, SSO subject).
- The internal mapping is enterprise-owned and stored in enterprise-controlled systems (HR directory, identity provider). It MUST NOT appear in any OTEP envelope.
- The tenant identifier scopes all data to the enterprise; a consumer MUST NOT mix data across tenant identifiers.
- A consumer MUST NOT transmit the internal mapping or any envelope to an external party without explicit enterprise consent (`SRP-PRIV-003`).

This mode explicitly permits the enterprise to re-identify operators **internally** using its own mapping, because the enterprise owns both the telemetry and the identity directory. External re-identification remains prohibited.

---

## 5. Retention Expectations

| Aspect | Expectation |
|--------|-------------|
| Default retention | Per enterprise policy |
| Minimum retention | 90 days from the observation window end |
| Maximum retention | Unbounded by the protocol; enterprise policy governs |
| Retention disclosure | Enterprise MUST disclose retention to operators per `SRP-SEC-004` |

Enterprise retention policy is set by the enterprise and disclosed to operators at deployment time. The 90-day minimum ensures operators can exercise export and deletion rights before records age out. Enterprises with legal or compliance retention requirements MAY retain longer, disclosed per `SRP-SEC-004`.

---

## 6. Access Model

| Data scope | Access |
|------------|--------|
| Aggregate statistics (tenant-level metrics, distributions) | **Enterprise admin only** — visible to authorized enterprise administrators |
| Individual operator records (per-envelope telemetry + metrics) | **Operator + enterprise admin** — operator sees own records; admin sees all tenant records |

A consumer hosting an `enterprise-isolated` deployment MUST authenticate access to tenant-scoped data. Access is restricted to enterprise admins and the individual operator (for their own records). No external party has access.

**`SRP-SEC-004`** Enterprise deployments MUST provide operators with:
- Access to their own telemetry
- The ability to opt out of enterprise collection (with documented consequences)
- Transparency about what is collected and how it is used

**Failure condition:** An enterprise deployment does not provide these operator rights.

---

## 7. Export Behavior

| Exporter | Scope | Format |
|----------|-------|--------|
| Enterprise admin | All tenant records (aggregate + individual) | Schema-valid OTEP envelope stream or aggregate report |
| Operator | Their own individual records only | Schema-valid OTEP envelope stream |
| External party | **Prohibited** without explicit enterprise consent | N/A |

- The enterprise admin MAY export all tenant records for internal analytics, compliance, or migration.
- **No external transmission** is permitted without explicit enterprise consent (`SRP-PRIV-003`). External transmission includes sending envelopes to a public platform, a third-party analytics vendor, or a research consortium.
- If the enterprise consents to external transmission, the exported records SHOULD be re-scoped to `public-pseudonymous` or `private-managed-cohort` mode and stripped of the tenant identifier, unless the external party is contractually bound to `enterprise-isolated` terms.

**`SRP-PRIV-003` failure condition:** An `enterprise-isolated` envelope is transmitted to an external consumer without explicit enterprise consent.

---

## 8. Deletion Behavior

**`SRP-PRIV-006`** An operator MAY request deletion of their telemetry from the enterprise consumer. The consumer MUST delete all envelopes bearing the operator's pseudonymous key (within the tenant) within **30 days** and confirm deletion.

- Deletion MUST be irreversible unless a legal hold requires retention (disclosed to the operator).
- Upon deletion, the operator's contribution MUST be removed from any future aggregate publication within the tenant.
- An enterprise admin MAY request bulk deletion of a tenant or subset; the consumer MUST process within 30 days.
- Enterprises subject to GDPR, CCPA, or other data-protection regimes MUST align deletion timelines with the stricter of the regulatory requirement or 30 days.

**Failure condition:** A consumer refuses or fails to process a deletion request within 30 days.

---

## 9. Public-Ranking Eligibility

| Eligible? | No |
|-----------|----|

Envelopes in `enterprise-isolated` mode are **NOT eligible** for public ranking, public leaderboards, or public credentialing. Enterprise data is tenant-scoped and must not leave the tenant boundary.

A consumer MUST NOT publish any aggregate or individual statistic derived from an `enterprise-isolated` envelope on a public surface. Internal enterprise leaderboards (visible only to authorized admins) are permitted.

---

## 10. Small-Cell Suppression

**`SRP-PRIV-005`** When publishing aggregate statistics within the tenant, any group with fewer than 5 members MUST be suppressed (not displayed).

- Suppression applies to any grouping dimension within the tenant (by team, by tool, by model, by time bucket).
- Suppression is applied at publication time, not at collection time.
- A suppressed group MUST be omitted entirely or marked "suppressed (n < 5)"; it MUST NOT be replaced with zero or a placeholder revealing group size.

Small-cell suppression is especially important in enterprise contexts where small teams could be re-identified from aggregate statistics.

**Failure condition:** Published tenant statistics reveal a group with fewer than 5 members.

---

## 11. Deployment Assumptions

The `enterprise-isolated` mode assumes the following deployment context:

| Assumption | Detail |
|------------|--------|
| On-premise or private cloud | The consumer runs inside the enterprise's own infrastructure |
| No external data sharing | Envelopes never leave the tenant boundary without consent |
| Enterprise-owned identity mapping | The enterprise maintains pseudonymous-key-to-identity mapping internally |
| Tenant scoping | All queries, aggregation, and retention are scoped to a single tenant |
| Admin-governed access | Enterprise admins control access; operators have self-access and opt-out |
| Employee-surveillance guardrails | `SRP-SEC-003` prohibits using OTEP metrics as the sole basis for employment decisions |

This mode is NOT appropriate for public leaderboards (use `public-pseudonymous`) or multi-organization cohort benchmarking (use `private-managed-cohort`).

---

## 12. Conformance Checklist

A Privacy-profile conformance claim for `enterprise-isolated` mode requires:

- [ ] Envelopes validate against `schemas/telemetry-envelope-v0.1.schema.json`
- [ ] `privacy.mode` is set to `enterprise-isolated`
- [ ] Tenant identifier present in namespaced extension field
- [ ] No real-world identity field present in the envelope
- [ ] No `operator.cohort_id` (non-null) present
- [ ] No forbidden content field present (`SRP-VAL-006`)
- [ ] No external transmission without explicit enterprise consent (`SRP-PRIV-003`)
- [ ] Tenant aggregate publication applies small-cell suppression (n < 5)
- [ ] Access restricted to enterprise admin + operator self-access
- [ ] Operators have access, opt-out, and transparency per `SRP-SEC-004`
- [ ] OTEP metrics not used as sole basis for employment decisions (`SRP-SEC-003`)
- [ ] Deletion requests honored within 30 days
- [ ] Enterprise admin can export; external export prohibited without consent
- [ ] Retention ≥ 90 days with disclosed enterprise policy

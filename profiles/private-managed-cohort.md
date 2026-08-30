# Privacy Mode: Private Managed Cohort

**Privacy mode:** `private-managed-cohort`
**Authority:** Normative when adopted — see `REPOSITORY-ARCHITECTURE.md` §"Authority of Every Major Path".
**Spec reference:** SPEC.md §17.1, `SRP-PRIV-001` through `SRP-PRIV-008`.
**Conformance class:** Privacy-profile — see `conformance/classes.md`.

---

## 1. Purpose

The `private-managed-cohort` privacy mode governs telemetry envelopes that belong to a defined comparison group (cohort) whose membership and aggregate statistics are visible only to cohort members and the cohort administrator. It supports private benchmarking groups, enterprise team comparisons, and research cohorts without exposing individual or aggregate data to the public.

This mode adds the `operator.cohort_id` field so that consumers can group and compare operators within a named cohort, while prohibiting public publication of any record or aggregate derived from the cohort.

---

## 2. Permitted Fields

An envelope in `private-managed-cohort` mode MAY include all OTEP telemetry and metadata fields, **including** `operator.cohort_id`.

| Field group | Permitted | Notes |
|-------------|-----------|-------|
| `telemetry.input` | Yes | Required non-negative integer (`SRP-DATA-002`) |
| `telemetry.output` | Yes | Required non-negative integer (`SRP-DATA-003`) |
| `telemetry.cache_write` | Yes | Integer or null (`SRP-DATA-004`) |
| `telemetry.cache_read` | Yes | Integer or null (`SRP-DATA-005`) |
| `operator.pseudonymous_key` | Yes | Required — pseudonymous key only |
| `operator.cohort_id` | **Yes** | Required non-null string identifying the cohort |
| `observation.*` (timestamp, window) | Yes | Required RFC 3339 fields |
| `source.*` (tool, platform, provider, model, adapter) | Yes | Optional but recommended |
| `provenance.*` | Yes | Required level declaration |
| `validity.*` | Yes | Required status, flags |
| `extensions.*` (namespaced) | Yes | Subject to `SRP-EXT-003` |

`operator.cohort_id` MUST be a non-null, non-empty string in this mode. A null `cohort_id` in a `private-managed-cohort` envelope is a validation error.

---

## 3. Prohibited Fields

The following fields MUST NOT appear in a `private-managed-cohort` envelope.

| Prohibited field | Reason | Governing requirement |
|------------------|--------|------------------------|
| Real-world identity (name, email, user handle, employee ID, OAuth subject) | Re-identification risk | `SRP-DATA-011`, `SRP-VAL-002` item 6 |
| Any tenant identifier (e.g., `tenant_id`, `org_id`) | Enterprise isolation not applicable; cohort is the grouping unit | `SRP-PRIV-002` (by extension) |
| Prompt text, completion text, source code, diffs, keystrokes, screen contents | Content independence | `SRP-VAL-005`, `SRP-VAL-006` |

Note: `operator.cohort_id` is permitted and required, but it identifies a cohort, not a real-world person or enterprise tenant.

---

## 4. Identity Handling

A `private-managed-cohort` envelope carries `operator.pseudonymous_key` **plus** `operator.cohort_id`.

- The pseudonymous key MUST be a stable, opaque identifier that cannot be reversed without the platform's internal mapping.
- The cohort ID MUST be a stable identifier for the cohort (e.g., `cohort_research_2026_q3`). It does not reveal real-world identity.
- The cohort administrator (the party that defines and manages the cohort) is responsible for membership roster and the pseudonymous-key-to-identity mapping. Neither the roster nor the mapping appears in the envelope.
- A consumer MUST NOT attempt to re-identify an operator or enumerate cohort membership from envelopes alone.

---

## 5. Retention Expectations

| Aspect | Expectation |
|--------|-------------|
| Default retention | Per cohort policy |
| Minimum retention | 90 days from the observation window end |
| Maximum retention | Unbounded by the protocol; cohort policy governs |
| Retention disclosure | Cohort administrators SHOULD publish the cohort retention schedule |

The cohort policy is set by the cohort administrator and disclosed to members at join time. The 90-day minimum ensures operators can request export or deletion before records age out.

---

## 6. Access Model

| Data scope | Access |
|------------|--------|
| Aggregate statistics (cohort-level metrics, distributions) | **Cohort members only** — visible to members and the cohort admin |
| Individual operator records (per-envelope telemetry + metrics) | **Operator only** — accessible only to the operator via pseudonymous key; cohort admin sees aggregate, not individual peer records |

A consumer hosting a `private-managed-cohort` deployment MUST authenticate access to cohort-scoped aggregates. Individual peer records are not shared across cohort members; an operator sees only their own individual records plus the cohort aggregate.

---

## 7. Export Behavior

| Exporter | Scope | Format |
|----------|-------|--------|
| Cohort admin | Aggregate cohort statistics only | Schema-valid aggregate report; no individual peer records |
| Operator | Their own individual records only | Schema-valid OTEP envelope stream (JSON Lines / JSON array) |

- The cohort admin MAY export aggregate cohort statistics (distributions, group metrics) but MUST NOT export individual peer records.
- An operator MAY export only their own individual records (all envelopes bearing their pseudonymous key within the cohort).
- Exported records retain `privacy.mode = private-managed-cohort` and `operator.cohort_id`.

---

## 8. Deletion Behavior

**`SRP-PRIV-006`** An operator MAY request deletion of their telemetry from any consumer. The consumer MUST delete all envelopes bearing the operator's pseudonymous key (within the cohort) within **30 days** and confirm deletion.

- Deletion MUST be irreversible unless a legal hold requires retention (disclosed to the operator).
- Upon deletion, the operator's contribution MUST be removed from any future aggregate publication for the cohort.
- A cohort admin MAY request bulk deletion of an entire cohort; the consumer MUST process bulk deletion within 30 days.

**Failure condition:** A consumer refuses or fails to process a deletion request within 30 days.

---

## 9. Public-Ranking Eligibility

| Eligible? | No |
|-----------|----|

Envelopes in `private-managed-cohort` mode are **NOT eligible** for public ranking, public leaderboards, or public credentialing. Cohort data is private to the cohort.

A consumer MUST NOT publish any aggregate or individual statistic derived from a `private-managed-cohort` envelope on a public surface. Internal cohort leaderboards (visible only to members) are permitted.

---

## 10. Small-Cell Suppression

**`SRP-PRIV-005`** When publishing aggregate statistics within the cohort, any group with fewer than 5 members MUST be suppressed (not displayed).

- Suppression applies to any grouping dimension within the cohort (by tool, by model, by time bucket).
- Suppression is applied at publication time, not at collection time.
- A suppressed group MUST be omitted entirely or marked "suppressed (n < 5)"; it MUST NOT be replaced with zero or a placeholder revealing group size.

**Failure condition:** Published cohort statistics reveal a group with fewer than 5 members.

---

## 11. Deployment Assumptions

The `private-managed-cohort` mode assumes the following deployment context:

| Assumption | Detail |
|------------|--------|
| Private benchmarking groups | A defined group of operators compares aggregate metrics internally |
| Enterprise team comparisons | Teams within an enterprise compare efficiency without exposing data externally |
| Research cohorts | A study cohort collects telemetry for analysis under a defined protocol |
| Cohort administrator | A party defines membership, retention, and access policy |
| Authenticated access | Cohort aggregates require membership authentication |

This mode is NOT appropriate for open public leaderboards (use `public-pseudonymous`) or fully isolated enterprise deployments with tenant-scoped data (use `enterprise-isolated`).

---

## 12. Conformance Checklist

A Privacy-profile conformance claim for `private-managed-cohort` mode requires:

- [ ] Envelopes validate against `schemas/telemetry-envelope-v0.1.schema.json`
- [ ] `privacy.mode` is set to `private-managed-cohort`
- [ ] `operator.cohort_id` is a non-null, non-empty string
- [ ] No real-world identity field present
- [ ] No tenant identifier present
- [ ] No forbidden content field present (`SRP-VAL-006`)
- [ ] Cohort aggregate publication applies small-cell suppression (n < 5)
- [ ] Cohort aggregates accessible to members only (authenticated)
- [ ] Individual peer records not shared across members
- [ ] Deletion requests honored within 30 days
- [ ] Cohort admin can export aggregate only; operator can export own records
- [ ] Retention ≥ 90 days with disclosed cohort policy

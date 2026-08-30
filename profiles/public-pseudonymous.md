# Privacy Mode: Public Pseudonymous

**Privacy mode:** `public-pseudonymous`
**Authority:** Normative when adopted — see `REPOSITORY-ARCHITECTURE.md` §"Authority of Every Major Path".
**Spec reference:** SPEC.md §17.1, `SRP-PRIV-001` through `SRP-PRIV-008`.
**Conformance class:** Privacy-profile — see `conformance/classes.md`.

---

## 1. Purpose

The `public-pseudonymous` privacy mode governs telemetry envelopes that are eligible for public aggregate publication and individual-operator disclosure under a pseudonymous identifier. It is the default mode for open-participation platforms, public leaderboards, and community benchmarking surfaces where operators consent to have their aggregate statistics compared openly.

This mode maximizes comparability across operators while prohibiting any field that could re-identify a real-world person. It is the only privacy mode whose records are eligible for public ranking (see §9).

---

## 2. Permitted Fields

An envelope in `public-pseudonymous` mode MAY include all TTEOP telemetry and metadata fields **except** cohort and tenant identifiers.

| Field group | Permitted | Notes |
|-------------|-----------|-------|
| `telemetry.input` | Yes | Required non-negative integer (`SRP-DATA-002`) |
| `telemetry.output` | Yes | Required non-negative integer (`SRP-DATA-003`) |
| `telemetry.cache_write` | Yes | Integer or null (`SRP-DATA-004`) |
| `telemetry.cache_read` | Yes | Integer or null (`SRP-DATA-005`) |
| `operator.pseudonymous_key` | Yes | Required — pseudonymous key only |
| `observation.*` (timestamp, window) | Yes | Required RFC 3339 fields |
| `source.*` (tool, platform, provider, model, adapter) | Yes | Optional but recommended |
| `provenance.*` | Yes | Required level declaration |
| `validity.*` | Yes | Required status, flags |
| `extensions.*` (namespaced) | Yes | Subject to `SRP-EXT-003` |

---

## 3. Prohibited Fields

The following fields MUST NOT appear in a `public-pseudonymous` envelope.

| Prohibited field | Reason | Governing requirement |
|------------------|--------|------------------------|
| `operator.cohort_id` (non-null) | Cohort membership is private | `SRP-PRIV-002` |
| Any tenant identifier (e.g., `tenant_id`, `org_id`) | Enterprise isolation not applicable | `SRP-PRIV-002` |
| Real-world identity (name, email, user handle, employee ID, OAuth subject) | Re-identification risk | `SRP-DATA-011`, `SRP-VAL-002` item 6 |
| Prompt text, completion text, source code, diffs, keystrokes, screen contents | Content independence | `SRP-VAL-005`, `SRP-VAL-006` |

**`SRP-PRIV-002` failure condition:** A `public-pseudonymous` envelope contains `operator.cohort_id` set to a non-null value or any tenant identifier.

---

## 4. Identity Handling

A `public-pseudonymous` envelope carries **only** `operator.pseudonymous_key`. No real-world identity field is permitted in any envelope location.

- The pseudonymous key MUST be a stable, opaque identifier (e.g., a hash of a platform-scoped user ID) that cannot be reversed without access to the platform's internal mapping.
- The platform that mints the pseudonymous key is responsible for maintaining the mapping between real identity and pseudonymous key; that mapping MUST NOT appear in the envelope.
- A consumer MUST NOT attempt to re-identify an operator from a `public-pseudonymous` envelope. Re-identification attempts are a conformance violation and a violation of `SRP-DATA-011`.

---

## 5. Retention Expectations

| Aspect | Expectation |
|--------|-------------|
| Default retention | Per platform policy |
| Minimum retention | 90 days from the observation window end |
| Maximum retention | Unbounded by the protocol; platform policy governs |
| Retention disclosure | Platforms SHOULD publish their retention schedule |

The 90-day minimum ensures that operators have a reasonable window to request export (§7) or deletion (§8) before records age out. A platform MAY retain records longer than 90 days provided its published policy discloses the schedule.

---

## 6. Access Model

| Data scope | Access |
|------------|--------|
| Aggregate statistics (grouped metrics, distributions) | **Public read** — any consumer may read published aggregate stats |
| Individual operator records (per-envelope telemetry + metrics) | **Private read** — accessible only to the operator themselves (via pseudonymous key) and the hosting platform |

A consumer publishing under `public-pseudonymous` mode MUST apply small-cell suppression (§10) before exposing any aggregate statistic publicly. Individual records are never published in the clear; only the operator holding the pseudonymous key may retrieve their own individual records.

---

## 7. Export Behavior

- An operator MAY export their own individual records (all envelopes bearing their pseudonymous key) from the hosting platform.
- Export format MUST be a schema-valid TTEOP envelope stream (JSON Lines or a JSON array of envelopes validating against `schemas/telemetry-envelope-v0.1.schema.json`).
- Exported individual records retain `privacy.mode = public-pseudonymous` and MUST NOT gain cohort or tenant fields during export.
- Aggregate export by a cohort admin is not applicable in this mode (no cohort concept).

---

## 8. Deletion Behavior

**`SRP-PRIV-006`** An operator MAY request deletion of their telemetry from any consumer. The consumer MUST delete all envelopes bearing the operator's pseudonymous key within **30 days** of the request and confirm deletion to the operator.

- Deletion MUST be irreversible (not merely hidden) unless a legal hold requires retention, in which case the consumer MUST disclose the hold.
- Deletion of individual records does not require recomputation of already-published aggregate statistics, but the operator's contribution MUST be removed from any future aggregate publication.

**Failure condition:** A consumer refuses or fails to process a deletion request within 30 days.

---

## 9. Public-Ranking Eligibility

| Eligible? | Yes |
|-----------|-----|

Envelopes in `public-pseudonymous` mode are **eligible** for public ranking, leaderboards, and credentialing surfaces built on top of the TTEOP protocol. This is the only privacy mode with public-ranking eligibility.

A public ranking built on `public-pseudonymous` records MUST still comply with `SRP-NON-006` and `SRP-NON-007`: it is an application-layer feature, not a base-protocol requirement, and it MUST disclose the field definition, eligibility criteria, observation window, and provenance level of ranked records.

---

## 10. Small-Cell Suppression

**`SRP-PRIV-005`** When publishing aggregate statistics, any group with fewer than 5 members MUST be suppressed (not displayed).

- Suppression applies to any grouping dimension (by tool, by model, by provider, by time bucket, by provenance level).
- Suppression is applied at publication time, not at collection time; individual records are still collected and retained.
- A suppressed group MUST NOT be replaced with a value of zero or a placeholder that reveals the group size; it MUST be omitted entirely or marked as "suppressed (n < 5)".

**Failure condition:** Published statistics reveal a group with fewer than 5 members.

---

## 11. Deployment Assumptions

The `public-pseudonymous` mode assumes the following deployment context:

| Assumption | Detail |
|------------|--------|
| Public leaderboard | A platform publishes aggregate operator statistics on an open surface |
| Open participation | Any operator may opt in by minting a pseudonymous key through the platform |
| Single-platform key minting | The platform mints and holds the pseudonymous-key-to-identity mapping |
| No cross-platform identity | Pseudonymous keys are not portable across platforms in v0.1 |
| Consent model | Operators consent to public aggregate publication at opt-in time |

This mode is NOT appropriate for enterprise internal benchmarking (use `enterprise-isolated`) or private cohort comparison (use `private-managed-cohort`).

---

## 12. Conformance Checklist

A Privacy-profile conformance claim for `public-pseudonymous` mode requires:

- [ ] Envelopes validate against `schemas/telemetry-envelope-v0.1.schema.json`
- [ ] `privacy.mode` is set to `public-pseudonymous`
- [ ] No `operator.cohort_id` (non-null) or tenant identifier present
- [ ] No real-world identity field present
- [ ] No forbidden content field present (`SRP-VAL-006`)
- [ ] Aggregate publication applies small-cell suppression (n < 5)
- [ ] Deletion requests honored within 30 days
- [ ] Individual records accessible to operator via pseudonymous key
- [ ] Retention ≥ 90 days with published schedule

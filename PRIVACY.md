# Privacy

**Document status:** Normative
**Spec version:** otep/0.1-draft

This document defines the three OTEP privacy modes and the content-independence
requirements that bind all implementations. It is referenced normatively by
SPEC.md §17. The requirements here carry the same authority as SPEC.md.

---

## 1. Core principle: metadata-only measurement

**`SRP-PRIV-004`** (restated from SPEC.md §17) All privacy modes MUST NOT
require collection of prompt text, completion text, source code, diffs,
keystrokes, screen contents, unrestricted file paths, or sensitive repository
content.

**`SRP-PRIV-007`** (restated from SPEC.md §17.2) The core OTEP metrics MUST be
computable from token counts alone, without any semantic content.

**Failure condition:** Any implementation requires semantic content to compute
core metrics.

The protocol is designed so that an operator can submit a conformant envelope
containing only four integers and metadata. No content ever needs to leave the
operator's device for the core metrics to be computed.

---

## 2. The three privacy modes

### 2.1 `public-pseudonymous`

The default mode for public benchmarking and open comparison.

| Property | Value |
|----------|-------|
| **Permitted fields** | All envelope fields except `operator.cohort_id` and any tenant identifier |
| **Prohibited fields** | `operator.cohort_id`, tenant identifiers, real-world identity (name, email, employee ID) |
| **Identity handling** | Pseudonymous key only (`operator.pseudonymous_key`). The key MUST NOT be reversible to a real identity without out-of-band information held by the operator. |
| **Retention expectations** | Per platform policy. The protocol does not mandate a retention period; platforms SHOULD publish their retention policy. |
| **Access model** | Public. Envelopes in this mode MAY be published, aggregated, and compared publicly. |
| **Export behavior** | Full envelope MAY be exported. |
| **Deletion behavior** | An operator MUST be able to request deletion (SRP-PRIV-006). Consumer MUST delete within 30 days. |
| **Public-ranking eligibility** | Eligible. Records in this mode MAY appear in public leaderboards subject to platform eligibility rules. |
| **Small-cell suppression** | Required. Any published group with fewer than 5 members MUST be suppressed. |
| **Deployment assumptions** | Public web services, open leaderboards, research datasets. |

**`SRP-PRIV-002`** (restated) An envelope in `public-pseudonymous` mode MUST
NOT include `operator.cohort_id` or any tenant identifier.

**Failure condition:** A `public-pseudonymous` envelope contains cohort or
tenant identifiers.

### 2.2 `private-managed-cohort`

A mode for private cohorts managed by a platform (e.g., a curated reference
cohort or a private study group).

| Property | Value |
|----------|-------|
| **Permitted fields** | All envelope fields, including `operator.cohort_id` |
| **Prohibited fields** | Real-world identity, tenant identifiers (use `cohort_id` instead) |
| **Identity handling** | Pseudonymous key + cohort ID. The cohort ID identifies the cohort, not the operator. |
| **Retention expectations** | Per cohort policy. The cohort operator SHOULD publish retention rules. |
| **Access model** | Restricted to cohort members and the cohort operator. NOT public. |
| **Export behavior** | Envelope MAY be exported within the cohort. Export outside the cohort requires operator consent. |
| **Deletion behavior** | SRP-PRIV-006 applies. Deletion MUST propagate to all cohort stores. |
| **Public-ranking eligibility** | NOT eligible. Records in this mode MUST NOT appear in public leaderboards. |
| **Small-cell suppression** | Required within cohort publications. |
| **Deployment assumptions** | Managed cohorts, private studies, platform-curated reference groups. |

### 2.3 `enterprise-isolated`

A mode for enterprise deployments where telemetry stays within an
organization's boundary.

| Property | Value |
|----------|-------|
| **Permitted fields** | All envelope fields, including a tenant identifier in `operator.cohort_id` or an enterprise extension |
| **Prohibited fields** | Real-world identity in the core envelope (enterprises MAY link pseudonymous keys to identity via a separate, access-controlled store, but the envelope itself MUST NOT carry real identity) |
| **Identity handling** | Pseudonymous key + tenant ID. The enterprise MAY maintain a separate mapping outside the protocol. |
| **Retention expectations** | Per enterprise policy, subject to applicable employment law. |
| **Access model** | Enterprise-internal only. NOT public. |
| **Export behavior** | Envelope MUST NOT be transmitted to any external consumer without explicit enterprise consent. |
| **Deletion behavior** | SRP-PRIV-006 applies. Enterprise MUST provide deletion on operator request. |
| **Public-ranking eligibility** | NOT eligible. Records in this mode MUST NOT appear in public leaderboards. |
| **Small-cell suppression** | Required for any internal published statistics. |
| **Deployment assumptions** | Enterprise analytics, internal benchmarking, team-level reporting. |

**`SRP-PRIV-003`** (restated) An envelope in `enterprise-isolated` mode MUST
NOT be transmitted to any external consumer without explicit enterprise
consent.

**Failure condition:** An enterprise-isolated envelope is transmitted
externally without consent.

---

## 3. Small-cell suppression

**`SRP-PRIV-005`** (restated) When publishing aggregate statistics, any group
with fewer than 5 members MUST be suppressed (not displayed).

**Failure condition:** Published statistics reveal a group with fewer than 5
members.

**Rationale:** Small groups allow re-identification of individuals even in
pseudonymous data. The threshold of 5 is consistent with common statistical
disclosure practice. Platforms MAY use a higher threshold but MUST NOT use a
lower one.

---

## 4. Deletion

**`SRP-PRIV-006`** (restated) An operator MUST be able to request deletion of
their telemetry from any consumer. The consumer MUST delete within 30 days and
confirm deletion.

**Failure condition:** A consumer refuses or fails to process a deletion
request.

**Scope:** Deletion covers the envelope and any derived aggregates that can be
attributed to the operator's pseudonymous key. Aggregates that have been
anonymized (e.g., summed into a large-group statistic with no per-operator
breakdown) do not require deletion.

---

## 5. Employee-surveillance misuse

**`SRP-SEC-003`** (restated from SPEC.md §18.3) The specification explicitly
prohibits using OTEP metrics as the sole basis for employment decisions
(hiring, firing, promotion, compensation).

**`SRP-SEC-004`** (restated) Enterprise deployments MUST provide operators
with:
- Access to their own telemetry
- The ability to opt out of enterprise collection (with documented consequences)
- Transparency about what is collected and how it is used

**Failure condition:** An enterprise deployment does not provide these
operator rights.

---

## 6. Content-independence validation

**`SRP-VAL-005`** (restated from SPEC.md §14.5) A telemetry envelope MUST NOT
contain prompt text, completion text, source code, diffs, keystrokes, screen
contents, unrestricted file paths, or sensitive repository content.

**`SRP-VAL-006`** (restated) The following field names are forbidden in all
envelope locations: `prompt`, `prompt_text`, `completion`, `completion_text`,
`response_text`, `source_code`, `code`, `diff`, `keystrokes`,
`screen_content`, `file_path`, `file_content`, `repo_content`.

**Failure condition:** Any forbidden field name appears in the envelope.

---

## 7. Enrichment boundary

**`SRP-PRIV-008`** (restated from SPEC.md §17.2) Optional enrichment (model,
provider, tool, timestamps, workflow stage, task result, PR data, cost,
incidents, business KPIs) MAY be combined with OTEP metrics but MUST be
distinguishable from the core metric layer.

Enrichment fields belong in the `extensions` object with a namespace prefix,
or in a separate analytics layer. They MUST NOT be mixed into the `telemetry`
or `metrics` objects.

---

## 8. Privacy-mode conformance

See `conformance/classes.md` §1.5 for the privacy-profile conformance class
and its mandatory tests (PRIV-001 through PRIV-008). An implementation claiming
privacy-profile conformance for a specific mode MUST pass all mandatory tests
for that mode.

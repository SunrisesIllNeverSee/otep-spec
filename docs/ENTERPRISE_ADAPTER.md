# Enterprise Adapter and Lineage Contract

**Status:** Draft
**Spec:** sigrank/0.1-draft extension
**Date:** 2026-08-28

## Purpose

This document defines the contract for enterprise adapters that feed
external outcome data into the Upsilon lineage chain. It is a
non-normative extension to the sigrank/0.1-draft portable core —
the portable core defines telemetry primitives and metrics; this
contract defines how enterprise systems correlate those metrics with
external outcomes.

**The portable standard does not require enterprise adapters.** This
contract exists so that enterprises adopting Upsilon can do so with a
consistent adapter interface.

## Lineage Chain

The lineage chain traces an operator's action from initial state to
committed outcome:

```
STATE_A → BI_ACTION → AAI_TRANSFORMATION → BI_REDIRECTION → AAI_EXTENSION → COMMITTED_STATE → OUTCOME
```

| Stage | Description | Source |
|-------|-------------|--------|
| STATE_A | Initial operator state (context, task assignment) | Enterprise system |
| BI_ACTION | Human action (prompt submission, task selection) | Operator telemetry |
| AAI_TRANSFORMATION | AI transformation (cache write, generation) | Operator telemetry |
| BI_REDIRECTION | Human redirection (follow-up, correction) | Operator telemetry |
| AAI_EXTENSION | AI extension (cache read, continuation) | Operator telemetry |
| COMMITTED_STATE | Final committed artifact (merged PR, deployed code) | Enterprise system |
| OUTCOME | Outcome measurement (quality score, cycle time, bug rate) | Enterprise system |

**Operator telemetry stages** (BI_ACTION through AAI_EXTENSION) are
captured by the sigrank/0.1-draft portable core (I/O/W/R primitives).

**Enterprise stages** (STATE_A, COMMITTED_STATE, OUTCOME) are fed by
enterprise adapters defined in this contract.

## Adapter Interface

An enterprise adapter is a function that produces lineage entries for
the enterprise stages. Adapters are read-only — they do not modify the
enterprise system.

### Adapter signature

```typescript
interface EnterpriseAdapter {
  /** Adapter identifier (e.g., "github", "jira", "linear"). */
  name: string;

  /** Fetch STATE_A entries — initial operator states. */
  getStateA(operatorId: string, window: TimeWindow): Promise<StateAEntry[]>;

  /** Fetch COMMITTED_STATE entries — final committed artifacts. */
  getCommittedState(operatorId: string, window: TimeWindow): Promise<CommittedStateEntry[]>;

  /** Fetch OUTCOME entries — outcome measurements. */
  getOutcome(operatorId: string, window: TimeWindow): Promise<OutcomeEntry[]>;
}

interface TimeWindow {
  start: string;  // ISO 8601
  end: string;    // ISO 8601
}

interface StateAEntry {
  operator_id: string;
  timestamp: string;  // ISO 8601
  context: string;    // Task description or context
  task_type?: string; // e.g., "code_review", "feature_dev", "debugging"
}

interface CommittedStateEntry {
  operator_id: string;
  timestamp: string;
  artifact_type: string;  // e.g., "pr_merged", "deploy", "ticket_closed"
  artifact_id: string;    // External system ID
  metadata?: Record<string, unknown>;
}

interface OutcomeEntry {
  operator_id: string;
  timestamp: string;
  quality_score?: number;     // 0-5 scale (enterprise-defined)
  cycle_time_hours?: number;
  bug_count?: number;
  rollback_count?: number;
  incident_count?: number;
  custom_metrics?: Record<string, number>;
}
```

## Correlation Contract

Enterprise systems MAY correlate operator telemetry (Yield, Leverage,
Velocity, SNR, 10xDEV) with outcome measurements via lineage chains.

**All correlations are ASSOCIATION, never CAUSATION.**

| Claim | Evidence Grade | Permitted |
|-------|---------------|-----------|
| "Yield correlates with quality_score (r=0.34)" | OBSERVATIONAL | Yes |
| "Higher Yield causes higher quality" | — | No |
| "Leverage is associated with shorter cycle times" | OBSERVATIONAL | Yes |
| "Increasing Leverage will reduce cycle time" | — | No |

### Evidence grades

- **OBSERVATIONAL** — computed from observational data without intervention
- **QUASI_EXPERIMENTAL** — pre/post comparison with intervention but no randomization
- **EXPERIMENTAL** — randomized controlled trial (requires explicit authorization)

Only OBSERVATIONAL and QUASI_EXPERIMENTAL grades are available via the
standard adapter interface. EXPERIMENTAL requires a separate
authorization contract.

## Privacy and Governance

### Pseudonymity

Enterprise adapters MUST use pseudonymous operator IDs (e.g.,
`op_001`). The mapping between pseudonymous IDs and real identities is
held by the enterprise system, not by the measurement platform.

### Data minimization

Adapters SHOULD return only the fields needed for correlation analysis.
Personal names, email addresses, and free-text content MUST NOT be
transmitted through the adapter interface.

### Governance labels

All outputs from lineage correlation tools MUST carry:

- `evidence_grade`: OBSERVATIONAL | QUASI_EXPERIMENTAL | EXPERIMENTAL
- `claim_status`: ASSOCIATION | CAUSATION (CAUSATION requires EXPERIMENTAL grade)
- `privacy_class`: pseudonymous | anonymous | identified

### No punitive use

Lineage correlation results are DEVELOPMENTAL, not PERSONNEL. They MUST
NOT be used for:

- Performance reviews
- Termination decisions
- Compensation adjustments
- Disciplinary actions

## Reference Implementation

The MO§ES™ MCP Server (`mcp.mos2es.org`) provides a reference
implementation of the lineage chain via these tools:

- `get_lineage_chain` — full lineage chain for an operator
- `get_lineage_summary` — cohort-level lineage summary
- `get_outcome_correlation` — Pearson r correlation via lineage
- `attach_outcome_dataset` — attach external outcome data (requires authorization)

The reference implementation uses a 50-operator synthetic pilot dataset.
Enterprise deployments replace the synthetic data with real adapter
output.

## Compatibility

This contract is a sigrank/0.1-draft extension. Implementations that
do not use enterprise adapters are still fully conformant to the
portable standard. The portable core (I/O/W/R + 5 metrics) does not
depend on lineage or outcome data.

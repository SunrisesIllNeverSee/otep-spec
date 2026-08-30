# Extraction Log

## Source

The normative documents in `docs/` were extracted from the `sigrank-app` repository, branch `feat/sigrank-phase-0-bridge` (commit `845cd5e`), directory `standard/`.

## Extraction date

2026-08-28

## Method

Files were copied from the Phase 0 worktree. Git history attribution is preserved by this log — the original commits in `sigrank-app` contain the authorship and review history for each document.

## Files extracted

| Source path (`sigrank-app/standard/`) | Target path (`sigrank-standard/`) |
|---|---|
| `SPEC.md` | `docs/SPEC.md` |
| `GLOSSARY.md` | `docs/GLOSSARY.md` |
| `PRIVACY.md` | `docs/PRIVACY.md` |
| `CONFORMANCE.md` | `docs/CONFORMANCE.md` |
| `LIMITATIONS.md` | `docs/LIMITATIONS.md` |
| `GOVERNANCE.md` | `docs/GOVERNANCE.md` |
| `CHANGELOG.md` | `docs/CHANGELOG.md` |
| `CANON_RECONCILIATION.md` | `docs/CANON_RECONCILIATION.md` |
| `PRODUCT_ARCHITECTURE.md` | `docs/PRODUCT_ARCHITECTURE.md` |
| `ARCHETYPE_STATUS.md` | `docs/ARCHETYPE_STATUS.md` |
| `RS05_STATUS.md` | `docs/RS05_STATUS.md` |
| `schema/sigrank-operator-record-v0.1.schema.json` | `schema/sigrank-operator-record-v0.1.schema.json` |
| `examples/canonical-reference.json` | `examples/canonical-reference.json` |
| `reference/IMPLEMENTATION_MAP.md` | `reference/IMPLEMENTATION_MAP.md` |

## New files created for the standalone repository

| Path | Purpose |
|---|---|
| `README.md` | Repository overview |
| `docs/COMPATIBILITY.md` | Compatibility and deprecation policy |
| `rfc/RFC-0001.md` | RFC process template |
| `conformance/runner.mjs` | Executable conformance suite |
| `examples/fixtures/*.json` | 12 conformance test vectors |
| `integrations/typescript/example.ts` | TypeScript reference implementation |
| `integrations/python/example.py` | Python reference implementation |
| `integrations/cli/example.mjs` | CLI example |
| `integrations/mcp/example.mjs` | MCP server example |
| `.github/workflows/conformance.yml` | CI gate |
| `LICENSE` | Dual license (Apache-2.0 + CC BY 4.0) |
| `NOTICE` | Attribution notice |
| `reference/EXTRACTION_LOG.md` | This file |

## Relationship to SignalAF

SignalAF (`signalaf.com/standard`) remains the stable human-readable distribution URL. This repository is the source of truth for the specification, schema, fixtures, and conformance suite.

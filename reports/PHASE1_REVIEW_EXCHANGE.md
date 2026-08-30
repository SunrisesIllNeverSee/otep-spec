# Phase 1 Review Exchange — sigrank-standard

> Persistent log of every review pass and fix cycle for the Phase 1 Build Handoff
> (`sigrank-standard` repo, branch `fix/conformance-suite-gaps`). Each entry is one
> review exchange: prompt → review → (if REJECT) fix → re-review. Append-only.
> Scratchpad (`D-REP-SCRATCH.md`) entries are mirrored here as the canonical report.

**Repo:** `SunrisesIllNeverSee/sigrank-standard`
**Branch:** `fix/conformance-suite-gaps`
**PR:** [#2](https://github.com/SunrisesIllNeverSee/sigrank-standard/pull/2)
**Handoff:** Phase 1 Build Handoff (superseded 2026-08-28; governed by `COURSE_OF_SHIP.md`, `REPO_DOMAIN_OWNERSHIP_MAP.md`, `90_DAY_RECONCILED_ROADMAP.md`, `EXECUTION_HANDOFF.md`)

---

## Exchange 1 — Initial review — REJECT — 2026-08-28

**Reviewer:** Devin (GLM-5.2 High)
**Reviewed state:** `c9e17a3` (on top of `9840370` + `f17be44` + `3a150f4`)
**Diff provided:** empty (work done in prior sessions; review covers committed state)

### Verdict: REJECT

### What is correct and well-built

- JS conformance runner (`conformance/runner.mjs`): self-contained, dependency-free, 12/12 pass, validates schema + primitives + metrics + warnings (ordered arrays) + version declaration + alias translation (output keys + cache_creation leak) + content independence (telemetry AND record) + required_fields + extension exclusion + provenance
- Self-test (`runner-self-test.mjs`): 3/3 pass, verifies runner catches wrong metric values and validates warnings exist
- CI workflow: runs JS runner + self-test + canonical schema validation + integration smoke tests
- Schema: well-defined, `additionalProperties: false`, nullable cache fields, required metrics
- 12 fixtures: cover all 12 conformance areas, canonical vector matches MO§ES seed (Υ 18436.98)
- TypeScript + CLI examples: correct, match JS runner logic exactly
- Boundary claims: properly bounded in README, SPEC §4, LIMITATIONS, GLOSSARY, PRODUCT_ARCHITECTURE
- No personal info leaks (git grep clean), `.venv`/`dist` gitignored, `pyproject` authors neutral
- Provenance documented in `EXTRACTION_LOG.md`
- Matches "recommended first PR" scope (standalone authority + conformance skeleton)

### Issue 1 (correctness — REJECT blocker): Python conformance runner parity gaps

The Python conformance runner (`python/sigrank_standard/conformance.py`, published on PyPI as `sigrank-standard` with `sigrank-conformance` CLI) has weaker validation than the authoritative JS runner. Confirmed by direct testing:

1. **`required_fields` not validated** — A fixture requiring `NONEXISTENT_FIELD` passes without error. The JS runner checks `expected.required_fields` against the built record (fixture 11). The Python runner never checks this.
2. **Version declaration not validated against actual record** — The Python runner only checks if `expected_spec != "sigrank/0.1-draft"`. It never builds a record and checks the actual `spec` field. The JS runner checks `record.spec !== expected.spec`. A Python implementation emitting the wrong spec version would pass.
3. **Alias translation output keys not validated** — The Python runner only checks that `cache_creation` was "accepted" by verifying dev10x was computed. It does not check `output_telemetry_keys` against the built record's telemetry keys, and does not check for `cache_creation` leakage. The JS runner validates both.
4. **No schema validation** — The JS runner has a full `validateAgainstSchema` function (type, required, const, additionalProperties, minimum, minLength, enum, items). The Python runner only checks that `input` and `output` are present.
5. **Content independence only checks input telemetry** — The JS runner checks forbidden fields in both `record.telemetry` AND `record` (top-level). The Python runner only checks `telemetry` (the input), not the output record.

**Root cause:** The Python `_validate_fixture` uses `compute_metrics()` directly instead of `build_record()`, so it never constructs a full record to validate against. The scratchpad report ("Devin → Log: sigrank-standard review findings fixed") claimed "Python conformance runner hardened" with warnings, version, alias, and provenance validation — but the version and alias checks are weaker than described, and schema/required_fields validation is missing entirely.

### Issue 2 (completion — noted, not blocker): CI does not test Python conformance runner

The CI workflow runs `python3 integrations/python/example.py` (the standalone example) but does NOT run `python -m sigrank_standard` (the published package's conformance runner). A regression in the Python conformance runner would go undetected by CI.

### Issue 3 (completion — expected deferral): Full Phase 1 acceptance criteria not met

Cross-repository conformance gates (scope item 3) and "both SignalAF and sigrank-mcp pass the same fixtures" (acceptance criteria 2) are not done. These are explicitly deferred as separate tasks per prior scratchpad reports. The "recommended first PR" scope is satisfied. This is expected, not a defect.

### Fix required for merge

- Python `conformance.py` `_validate_fixture` should call `build_record()` and validate the full record (spec field, output telemetry keys, required_fields, schema structure, content independence at record level) — matching the JS runner's validation surface
- CI should run `python -m sigrank_standard` to catch Python runner regressions

---

## Exchange 1 — Fix applied — 2026-08-28

**Fixed by:** Devin
**Fix commit:** `df3865a` (on top of `c9e17a3`)
**Pushed:** yes

### Issue 1 fixed — Python conformance runner parity gaps (REJECT blocker)

Rewrote `python/sigrank_standard/conformance.py` `_validate_fixture` to call `build_record()` instead of `compute_metrics()` directly, so it now validates the full record output surface — matching the JS runner byte-for-byte:

1. **`required_fields` now validated** — checks `expected.required_fields` against the built record's top-level keys. A fixture requiring `NONEXISTENT_FIELD` now fails. Confirmed by adversarial test.
2. **Version declaration checked against actual record** — compares `record["spec"]` against `expected.spec`. A wrong spec version is now caught. Confirmed by adversarial test.
3. **Alias translation output keys validated** — checks `expected.output_telemetry_keys` against the built record's sorted telemetry keys AND checks for `cache_creation` leakage. A leaked key is now caught. Confirmed by adversarial test.
4. **Schema validation added** — new `_validate_against_schema` function (self-contained, no external deps) mirrors the JS `validateAgainstSchema`: type (string or array incl. null), required, const, additionalProperties, minimum, minLength, enum, items, properties recursion. Catches bad spec const, missing required fields, additional properties. Confirmed by direct tests.
5. **Content independence checks record top-level** — forbidden fields now checked in both `record["telemetry"]` AND `record` (top-level), matching the JS runner.

### Issue 2 fixed — CI now tests Python conformance runner

Added two CI steps to `.github/workflows/conformance.yml`:
- `pip install -e python/ --quiet` + `python -m sigrank_standard` — runs the published package's conformance runner
- `python3 conformance/tests/runner-self-test.py` — runs the new Python self-test

### New file — Python self-test (`conformance/tests/runner-self-test.py`)

Mirrors the JS self-test (`runner-self-test.mjs`) plus three new parity tests:
1. Runner exits 0 on current fixtures
2. Runner catches incorrect metric values (swaps fixture expected value, confirms failure)
3. Runner validates warnings (≥6 fixtures with expected warnings exist)
4. Runner catches missing required_fields (NEW — guards parity fix #1)
5. Runner catches wrong version declaration (NEW — guards parity fix #2)
6. Runner catches alias translation leak (NEW — guards parity fix #3)

Without this, a regression making the Python runner always-pass would go undetected — the same gap the JS self-test was added to close.

---

## Exchange 2 — Re-review — ACCEPT — 2026-08-28

**Reviewer:** Devin (GLM-5.2 High)
**Reviewed state:** `df3865a` (on top of `c9e17a3`)
**Diff provided:** empty (work done in prior sessions; review covers committed state)

### Verdict: ACCEPT

### Previous REJECT issues — both fixed and verified

**Issue 1 (Python conformance runner parity gaps — REJECT blocker): FIXED.**
`python/sigrank_standard/conformance.py` `_validate_fixture` now calls `build_record()` instead of `compute_metrics()` directly, validating the full record output surface. Confirmed by 5 adversarial tests run this session:
1. `required_fields` now validated — fixture requiring `NONEXISTENT_FIELD` fails ✓
2. Version declaration checked against actual `record["spec"]` — wrong spec caught ✓
3. Alias translation output keys validated + `cache_creation` leak check — leak caught ✓
4. Schema validation added (`_validate_against_schema` mirrors JS `validateAgainstSchema`: type/required/const/additionalProperties/minimum/minLength/enum/items) — bad spec const caught ✓
5. Content independence checks record top-level (not just telemetry) — forbidden field in record caught ✓

**Issue 2 (CI does not test Python conformance runner): FIXED.**
`.github/workflows/conformance.yml` now runs `pip install -e python/` + `python -m sigrank_standard` + `python3 conformance/tests/runner-self-test.py`. New Python self-test (`conformance/tests/runner-self-test.py`) has 6 tests including 3 new parity guards (required_fields, version, alias leak).

### Verification (all run this session, fresh venv)

- `node conformance/runner.mjs` → 12/12 pass
- `node conformance/tests/runner-self-test.mjs` → 3/3 pass
- `python -m sigrank_standard` → 12/12 pass, exit 0
- `python3 conformance/tests/runner-self-test.py` → 6/6 pass
- `python3 integrations/python/example.py` → canonical Yield 18436.98, SNR 0.9003, dev10x 3.31
- `node integrations/cli/example.mjs --input 1251211 --output 11296121 --cache-write 128196310 --cache-read 2555179769` → canonical Yield 18436.98
- `node --experimental-strip-types --check integrations/typescript/example.ts` → 0 errors
- 5 adversarial parity tests → all PASS (Python runner has teeth matching JS)

### Correctness

JS and Python runners are functionally equivalent across all 11 validation areas (schema, primitives, metrics, warnings-ordered, version, alias, content-independence, required-fields, extension-exclusion, required-metrics, provenance). Canonical vector matches MO§ES seed (Υ 18436.98). 10xDEV formula simplified to `log10(R/I)` per SPEC §7.5 in both runners. Warning order consistent (cache-unavailable before `dev10x_undefined`).

### Security

`git grep -i "deric\|burnmydays\|proton.me\|gmail\|@users.noreply"` → no hits in tracked files. `python/pyproject.toml` authors = neutral `SunrisesIllNeverSee`. `.venv/`, `dist/`, `egg-info/` gitignored. No secrets. Boundary claims properly bounded in README, SPEC §4, LIMITATIONS, GLOSSARY, PRODUCT_ARCHITECTURE — EKG metaphor paired with explicit "does not prove cognition, work quality, employee productivity, or business outcomes" disclaimer.

### Completion

"Recommended first PR" scope satisfied — standalone authority (normative docs, schema, governance, compatibility, changelog, privacy, limitations) + conformance skeleton (runner, fixtures, self-test, CI). Cross-repository conformance gates (Phase 1 scope item 3) and "both SignalAF and sigrank-mcp pass the same fixtures" (acceptance criteria 2) remain deferred as separate tasks per prior scratchpad reports — expected, not a defect for this PR.

### Shortcuts

None detected. Python runner uses `build_record()` properly (not a shortcut around it). Self-tests guard against always-pass regressions on both runners. CI exercises both language implementations.

### Not authorized (per handoff)

No merge of PR #2 or PR #1. No merge of Phase 0 PRs (#78, #42, #7, #2). No package publication or deployment. PyPI 0.1.0 republish with these fixes would be a separate owner-approved release action.

---

## Commit history (review-relevant)

| Commit | Date | Summary |
|---|---|---|
| `3a150f4` | 2026-08-28 | feat: establish standalone SigRank Standard authority + conformance suite |
| `f17be44` | 2026-08-28 | fix: course-alignment wording + candidate governance status |
| `335acf0` | 2026-08-28 | feat: add sigrank-standard Python package on PyPI |
| `9840370` | 2026-08-28 | fix: close conformance suite validation gaps |
| `c9e17a3` | 2026-08-28 | fix: close review findings — Python parity, CI self-test, privacy |
| `df3865a` | 2026-08-28 | fix: close Python conformance parity gaps + add Python self-test |

---

## Open items (deferred, not blocking PR #2)

- Cross-repository conformance gates (Phase 1 scope item 3): validate `sigrank-mcp`, SignalAF HTTP MCP, and SigArena against the authoritative fixtures
- Enterprise adapter fixture
- "Both SignalAF and sigrank-mcp pass the same fixtures" (acceptance criteria 2)
- PyPI 0.1.0 republish with the parity fixes (separate owner-approved release action)
- Merge of PR #2 / PR #1 / Phase 0 PRs (#78, #42, #7, #2) — awaiting owner approval

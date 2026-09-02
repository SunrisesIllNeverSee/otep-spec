# TTEOP DOI and Release Citation Policy v1

**Status:** Active — owner-approved 2026-09-02  
**Scope:** TTEOP release metadata, citations, DOI badges, archival references, and downstream citation surfaces  
**Protocol impact:** None. This policy does not change TTEOP formulas, schemas, semantics, or conformance requirements.  
**Companion to:** `MAINTENANCE-CHARTER.md` §10 (release integrity)

## 1. Approved identifiers

| Purpose | DOI | Release relationship |
|---|---|---|
| Continuing TTEOP concept; all releases | [`10.5281/zenodo.22180348`](https://doi.org/10.5281/zenodo.22180348) | Stable concept DOI for the GitHub–Zenodo release lineage |
| TTEOP `v0.1.5-draft` | [`10.5281/zenodo.22180349`](https://doi.org/10.5281/zenodo.22180349) | Immutable version DOI for the archived `v0.1.5-draft` release |
| Historical manual `v0.1.3-draft` deposit | [`10.5281/zenodo.22179383`](https://doi.org/10.5281/zenodo.22179383) | Immutable historical version DOI; separate manual-deposit lineage |

## 2. Citation rules

1. The continuing concept DOI `10.5281/zenodo.22180348` is the default identifier for:
   - README DOI badges;
   - project landing pages;
   - documentation that refers to TTEOP generally or across releases;
   - catalogs, registries, and ecosystem pages that provide one durable TTEOP citation.
2. A version DOI is the required identifier for:
   - citations of a specific release;
   - `CITATION.cff` preferred-citation metadata for the current released version;
   - release notes, reproducibility records, implementation reports, and evidence tied to one immutable artifact.
3. The historical manual DOI `10.5281/zenodo.22179383` remains valid only for the archived `v0.1.3-draft` software object. It must not be presented as the continuing all-versions TTEOP DOI.
4. Existing DOI records and published release tags are immutable. A later correction receives a new source commit, version, tag, GitHub release, npm artifact, and Zenodo version DOI.
5. The GitHub–Zenodo concept DOI must remain stable across future automatically archived releases. Each future release receives its own version DOI under that concept.

## 3. Citation-surface matrix

| Surface | Required DOI behavior |
|---|---|
| Root README badge | Concept DOI |
| Root README citation example | Current version DOI, with concept DOI listed separately |
| `CITATION.cff` top-level identifiers | Concept DOI and current version DOI, clearly described |
| `CITATION.cff` preferred citation | Current version DOI |
| `SPEC.md` header | Current version DOI plus concept DOI |
| GitHub release notes | That release's version DOI plus concept DOI |
| npm release documentation | That release's version DOI when an archive exists |
| SignalAF and ecosystem standard pages | Concept DOI by default; version DOI when discussing one release |
| Historical `v0.1.3-draft` materials | Historical manual version DOI |

## 4. Release verification

Before declaring a release citable, verify this chain:

```text
source commit
    → annotated tag
    → passing CI
    → GitHub release
    → npm gitHead
    → Zenodo version archive
    → version DOI under the continuing concept DOI
```

The release record must confirm:

- package version, tag, release title, and citation version agree;
- the npm `gitHead` matches the GitHub release commit;
- the Zenodo archive identifies the same release version;
- the version DOI resolves to the immutable version record;
- the concept DOI resolves to the latest release in the continuing lineage;
- the README badge does not regress to a historical version DOI.

## 5. Current approved citation

For `v0.1.5-draft`:

```bibtex
@software{mchenry_2026_tteop_0_1_5,
  author  = {McHenry, Deric J},
  title   = {{TTEOP — Token Telemetry Evaluation Operator Protocol:
              Specification and Reference Implementation, v0.1.5-draft}},
  year    = {2026},
  version = {0.1.5-draft},
  url     = {https://doi.org/10.5281/zenodo.22180349},
  doi     = {10.5281/zenodo.22180349}
}
```

For a version-independent reference to the continuing project, cite:

```text
TTEOP — Token Telemetry Evaluation Operator Protocol
https://doi.org/10.5281/zenodo.22180348
```

## 6. Approval record

Owner decision recorded verbatim:

> I approve the TTEOP DOI and Release Citation Policy v1.

Approved by Deric J McHenry on 2026-09-02.

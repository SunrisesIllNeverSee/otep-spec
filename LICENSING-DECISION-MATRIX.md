# TTEOP Licensing Decision Matrix

**Status:** Draft — for legal review
**Last updated:** 2025
**Owner:** TTEOP Steering Group

## Purpose

This document records the recommended licensing approach for each class of
artifact produced by the TTEOP (Token Telemetry Evaluation Operator Protocol) project.
Licensing decisions for a standards effort are not one-size-fits-all: a
specification, a schema, a conformance test suite, and a reference
implementation serve different purposes and are consumed differently by
adopters. A license that is appropriate for prose may be inappropriate for
executable code, and vice versa.

The recommendations below are *drafts* intended to frame discussion with
qualified counsel. None of them constitute legal advice. Items marked
"requires legal review" must be reviewed by an attorney familiar with
open-source licensing, standards-body policy, and trademark law before the
project treats them as final.

## Guiding principles

1. **Maximize adoption.** The specification and its machine-readable artifacts
   should be usable by any party, commercial or otherwise, with minimal
   friction. Attribution is acceptable; copyleft on the spec is not.
2. **Protect implementers from patent risk.** Code that implementers are
   expected to run — the conformance runner, reference adapters, and test
   harness — should carry an explicit patent grant.
3. **Keep documentation freely redistributable.** Guides, READMEs, and
   explanatory material should be licensed to permit verbatim redistribution
   and adaptation with attribution.
4. **Do not confuse copyright with trademark.** A certification mark is
   governed by trademark law, not by a copyright license. The two regimes
   must be handled separately.
5. **Respect standards-body conventions where applicable.** If TTEOP ever
   aligns with or submits to an external standards body (W3C, IETF, ISO),
   that body may mandate a specific document license. The recommendations
   here assume TTEOP remains an independent community specification.

## Decision matrix

| Artifact | Recommended License | Rationale | Alternative | Legal Review Required? |
|---|---|---|---|---|
| Specification text (SPEC.md, TERMINOLOGY.md, TTEOPS, RFCs) | CC BY 4.0 | Permits adoption, excerpting, and derivative specifications with attribution and without copyleft. Widely used for open specifications (e.g., W3C Community Group drafts, Khronos). | W3C Document License or IETF Trust license if TTEOP is submitted to those bodies; CC BY-SA 4.0 if copyleft-on-derivatives is desired. | Yes — confirm compatibility with any target standards body. |
| Schemas (JSON Schema files, YAML data definitions) | CC BY 4.0 | Schemas describe structure and are documentation-like: their value is in being copied and reused. CC BY permits embedding in downstream products with attribution. | Apache 2.0 is also acceptable and preferred if the schema files are treated as code by downstream tooling (some build systems expect a code license). | Yes — confirm that schema files are not considered "code" by adopters' compliance teams. |
| Reference code (conformance runner, provider adapters, integrations) | Apache 2.0 | Industry-standard permissive license with an explicit patent grant and a contribution clause (CLA-equivalent via inbound=outbound). Compatible with most ecosystems and corporate policies. | MIT is simpler and shorter but lacks an explicit patent grant, which matters for code implementers are expected to run. | Yes — confirm inbound=outbound contribution terms and CLA needs. |
| Conformance tests (test vectors, harness, assertions) | Apache 2.0 | Tests are executable code and are run by implementers to verify compliance. An explicit patent grant is important so that running the tests cannot trigger patent assertions. | MIT acceptable only if patent risk is deemed negligible; not recommended. | Yes — confirm that test distribution does not create patent exposure for adopters. |
| Documentation (README, guides, tutorials, diagrams) | CC BY 4.0 | Documentation should be freely redistributable and adaptable. CC BY allows vendors to embed docs in product manuals with attribution. | CC BY-SA 4.0 if derivative docs must share-alike (discouraged; creates friction). | No (low risk), but confirm attribution requirements are practical. |
| Certification marks (e.g., "TTEOP Conformant") | Trademark law, not copyright | Marks are governed by trademark law. A copyright license does not confer the right to use a mark. Registration establishes the project's control over conformance claims. | Rely on unregistered common-law rights (weaker, jurisdiction-dependent). | Yes — requires trademark counsel. |

## Detailed notes by artifact class

### Specification text

The specification is the core of the project. Its license should make it easy
for vendors, researchers, and other standards bodies to adopt, quote, and
build derivative specifications. Creative Commons Attribution 4.0
International (CC BY 4.0) achieves this: it permits any use, commercial or
non-commercial, including derivative works, provided attribution is given and
changes are indicated.

Some standards bodies require their own document licenses. If TTEOP is ever
submitted to the W3C, the W3C Document License applies to W3C-published
versions; if submitted as an IETF Internet-Draft, the IETF Trust's legal
provisions (BCP 78 and BCP 79) apply. These are compatible in spirit with
CC BY 4.0 but are not identical. The final decision on the spec license
should account for any such submission path.

### Schemas

JSON Schema files occupy a gray area between documentation and code. They are
machine-readable and are sometimes processed by build pipelines as code, but
their semantic content is descriptive — they define what a valid telemetry
envelope looks like. CC BY 4.0 is appropriate because it permits downstream
embedding and modification with attribution.

Apache 2.0 is an acceptable alternative and may be preferable if adopters'
legal teams classify schema files as code and expect a code-style license
with a patent grant. The choice should be consistent across all schema files
in the repository.

### Reference code

The conformance runner, provider adapters, and integration libraries are
executable code that adopters will run, modify, and embed. Apache 2.0 is
recommended because it is widely accepted, includes an explicit patent grant
from contributors, and defines clear contribution terms (inbound equals
outbound). Most corporate open-source policies permit Apache 2.0 without
exception.

MIT is simpler and shorter, and is acceptable for small utility libraries,
but it lacks an explicit patent grant. For a conformance runner that
implementers depend on, the patent grant in Apache 2.0 provides meaningful
protection and is worth the additional license text.

### Conformance tests

The test suite is the arbiter of conformance. It must be freely runnable by
any implementer without legal risk. Apache 2.0 is recommended for the same
reasons as reference code: the patent grant protects implementers who run the
tests, and the contribution terms keep the suite maintainable.

### Documentation

READMEs, guides, tutorials, and diagrams are prose. CC BY 4.0 permits
vendors to excerpt and adapt documentation for their own products with
attribution, which supports adoption. Share-alike (CC BY-SA) is discouraged
because it would prevent vendors from incorporating TTEOP documentation into
proprietary manuals.

### Certification marks

A certification mark is a legal instrument distinct from copyright. It
allows the mark owner to certify that products or services meet defined
standards. If TTEOP establishes a formal certification program, the project
should register "TTEOP Conformant" (or a similar mark) in relevant
jurisdictions. Until a certification program exists, registration is
premature. This item requires trademark counsel and is out of scope for a
copyright licensing decision.

## Recommendations requiring counsel

The following items require review by qualified legal counsel before they are
treated as final:

1. **Final specification license.** Confirm CC BY 4.0 is compatible with any
   standards-body submission path under consideration (W3C, IETF, ISO/IEC
   JTC 1). If submission is planned, the body's mandated license may
   supersede CC BY 4.0 for published versions.

2. **Schema license classification.** Confirm whether adopters' compliance
   teams treat JSON Schema files as documentation (CC BY 4.0) or as code
   (Apache 2.0). The choice should be consistent and documented.

3. **Patent grant scope for Apache 2.0 code.** Confirm that the Apache 2.0
   patent grant covers the conformance runner and test suite as intended,
   and that the inbound=outbound contribution clause is sufficient or whether
   a separate Contributor License Agreement (CLA) is needed.

4. **Contributor License Agreement.** Determine whether a CLA is required for
   contributions to the specification, schemas, or code. If a CLA is adopted,
   confirm its terms are compatible with the recommended licenses.

5. **Certification mark registration.** If a certification program is
   established, engage trademark counsel to register "TTEOP Conformant" in
   target jurisdictions and to draft a certification mark usage policy
   defining how the mark may be used and how conformance is verified.

6. **Trademark protection for "TTEOP" itself.** Confirm whether the project
   name and logo should be registered as trademarks to prevent misuse,
   independent of any certification mark.

7. **Jurisdictional considerations.** Confirm that the recommended licenses
   are enforceable and interpreted as expected in the jurisdictions where
   TTEOP is expected to be adopted. CC BY 4.0 and Apache 2.0 are
   internationally oriented but have not been litigated in all jurisdictions.

8. **Interaction with commercial product licensing.** Confirm that the open
   licenses recommended here do not conflict with the licensing of the
   commercial product (SignalAF) or its proprietary extensions. The
   open/commercial boundary is documented separately in
   `OPEN-COMMERCIAL-BOUNDARY.md`; counsel should confirm the two are
   consistent.

## Summary

The recommended licensing approach is:

- **CC BY 4.0** for specification text, schemas, and documentation.
- **Apache 2.0** for reference code and conformance tests.
- **Trademark registration** for certification marks, contingent on
  establishing a certification program.

All recommendations are subject to legal review before finalization.

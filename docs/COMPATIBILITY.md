# Compatibility and Deprecation Policy

## Version scheme

TTEOP (Token Telemetry Evaluation Operator Protocol) uses a `MAJOR.MINOR-draft` version string (e.g. `tteop/0.1-draft`). The protocol was renamed from "OTEP" to "TTEOP" on 2026-08-30 (see `UNRESOLVED-DECISIONS.md` UD-1); the pre-rename wire identifier `otep/0.1-draft` and the legacy distribution alias `sigrank/0.1-draft` are accepted as legacy aliases by the schema and validator for backward compatibility.

- **MAJOR** — incremented when the wire format or required fields change in a way that breaks existing consumers.
- **MINOR** — incremented when new optional fields or clarifications are added without breaking existing consumers.
- **-draft** — suffix removed when the specification reaches stability (see acceptance criteria in `CONFORMANCE.md`).

## Compatibility guarantee

Within the same MAJOR version:
- Existing required fields MUST NOT be removed.
- Existing metric formulas MUST NOT change.
- Existing null semantics MUST NOT change.
- New optional fields MAY be added.
- Warnings MAY be added but not removed.

## Deprecation process

1. A field or behavior is marked deprecated in the spec and changelog.
2. A minimum one-version deprecation period is observed.
3. Removal occurs in the next MAJOR version with a migration guide.

## Change path

```text
RFC proposal
    ↓
public discussion
    ↓
draft specification update
    ↓
conformance fixture update
    ↓
reference implementation update
    ↓
conformance suite passes
    ↓
owner approval
    ↓
versioned release
```

## Prohibited changes during draft phase

- Removing a published wire identifier from the accepted set (the canonical `tteop/0.1-draft` plus the legacy aliases `otep/0.1-draft` and `sigrank/0.1-draft` MUST remain accepted throughout the 0.x series).
- Changing the four telemetry primitives (I/O/W/R).
- Changing the five metric formulas.
- Adding Construction, Build Archetypes, or RS05 to the portable core.
- Removing content-independence requirements.

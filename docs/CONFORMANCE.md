# Compatibility and Conformance

## `TTEOP Compatible — v0.1-draft`

A system may use this label when:

- it emits a versioned compatible record (`protocol_version` set to `tteop/0.1-draft` or a legacy alias `otep/0.1-draft` / `sigrank/0.1-draft`);
- I/O/W/R semantics are preserved;
- Yield, Leverage, Velocity, output_fraction, and log_leverage match the published draft definitions and null policy;
- missing telemetry is not fabricated;
- base calculations do not require semantic content.

## Reserved term

`TTEOP Conformant`

is reserved until a third-party implementation passes the executable conformance suite independently. The suite exists in this repository (`conformance/tteop-runner.mjs`) but has not yet been independently validated by a third party.

## Executable conformance suite

The conformance suite (`conformance/tteop-runner.mjs`) is a self-contained, dependency-free runner that loads all fixtures from `examples/fixtures/`, builds a complete TTEOP envelope from each fixture input, and validates the envelope against the expected output and the JSON Schema.

The suite tests:

1. schema validity (envelope validated against `schemas/telemetry-envelope-v0.1.schema.json`);
2. exact primitive semantics (non-negative integers, null for unavailable cache);
3. alias translation (`cache_creation` normalized to `cache_write` in output);
4. canonical reference vector (MO§ES Υ 18436.98);
5. zero input;
6. zero output;
7. zero cache write;
8. zero cache read;
9. missing cache telemetry (null semantics + missingness flags + warnings);
10. metric rounding policy (round-half-to-even / banker's rounding);
11. version declaration (`tteop/0.1-draft`, with legacy aliases `otep/0.1-draft` and `sigrank/0.1-draft` accepted);
12. content independence (no prompt/response/code/files/credentials in telemetry or envelope);
13. extension exclusion (no Construction, Build Archetypes, RS05, Scale V in base metrics);
14. provenance (source object with non-empty provider, model, tool);
15. enterprise adapter lineage (portable envelope remains conformant when outcome/lineage extensions are present — see [ENTERPRISE_ADAPTER.md](ENTERPRISE_ADAPTER.md)).

Warning semantics are validated as ordered arrays — a conforming implementation MUST produce the same warnings in the same order for each fixture.

Run the suite:

```bash
node conformance/tteop-runner.mjs
```

Exit code 0 = all fixtures pass. Exit code 1 = one or more failures.

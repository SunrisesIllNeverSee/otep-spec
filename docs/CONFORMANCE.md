# Compatibility and Conformance

## `SigRank Compatible — v0.1-draft`

A system may use this label when:

- it emits a versioned compatible record;
- I/O/W/R semantics are preserved;
- Yield, Leverage, Velocity, SNR, and 10xDEV match the published draft definitions and null policy;
- missing telemetry is not fabricated;
- base calculations do not require semantic content.

## Reserved term

`SigRank Conformant`

is reserved until a third-party implementation passes the executable conformance suite independently. The suite exists in this repository (`conformance/runner.mjs`) but has not yet been independently validated by a third party.

## Executable conformance suite

The conformance suite (`conformance/runner.mjs`) is a self-contained, dependency-free runner that loads all fixtures from `examples/fixtures/`, builds a complete SigRank Standard record from each fixture input, and validates the record against the expected output and the JSON Schema.

The suite tests:

1. schema validity (record validated against `schema/sigrank-operator-record-v0.1.schema.json`);
2. exact primitive semantics (non-negative integers, null for unavailable cache);
3. alias translation (`cache_creation` normalized to `cache_write` in output);
4. canonical reference vector (MO§ES Υ 18436.98);
5. zero input;
6. zero output;
7. zero cache write;
8. zero cache read;
9. missing cache telemetry (null semantics + warnings);
10. metric rounding policy;
11. version declaration (`spec: sigrank/0.1-draft`);
12. content independence (no prompt/response/code/files/credentials in telemetry or record);
13. extension exclusion (no Construction, Build Archetypes, RS05, Scale V in base metrics);
14. provenance (source object with non-empty provider, model, tool);
15. enterprise adapter lineage (portable record remains conformant when outcome/lineage extensions are present — see [ENTERPRISE_ADAPTER.md](ENTERPRISE_ADAPTER.md)).

Warning semantics are validated as ordered arrays — a conforming implementation MUST produce the same warnings in the same order for each fixture.

Run the suite:

```bash
node conformance/runner.mjs
```

Exit code 0 = all fixtures pass. Exit code 1 = one or more failures.

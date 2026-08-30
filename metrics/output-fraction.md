# output_fraction (F)

**Metric ID:** `tteop.output_fraction`
**Maturity:** Experimental
**Spec section:** SPEC.md §26.4
**Legacy alias:** `snr` (deprecated — see §Naming note)

---

## Formula

```
F = output / (input + output)
```

## Construct

output_fraction measures what fraction of total token flow (input + output) is
output. A value of 0.9 means 90% of all tokens in the observation window were
output tokens. It is a simple ratio that characterizes the direction of token
flow without requiring cache fields.

## Naming note

This metric was formerly named "SNR" (signal-to-noise ratio). That name is
**deprecated** because the formula `output / (input + output)` is not a
signal-to-noise ratio in any standard signal-processing sense. It is an output
fraction. The legacy alias `snr` is accepted in schemas and conformance runners
for backward compatibility, but new implementations and claims SHOULD use the
name `output_fraction`.

The frozen invariant value `0.9003` for the MOSES canonical seed vector is
preserved; only the name changes.

## Valid Domain

`[0, 1]` — output_fraction is always between 0 and 1 when defined.

## Division-by-Zero Behavior

- `input + output = 0` → output_fraction is `null` (undefined)

## Missing-Field Behavior

| Field missing | output_fraction behavior |
|---------------|--------------------------|
| `cache_read` is null | output_fraction is computable (does not require cache fields) |
| `cache_write` is null | output_fraction is computable (does not require cache fields) |
| `input` is null | Schema violation (input MUST NOT be null) |
| `output` is null | Schema violation (output MUST NOT be null) |

## Dimensional and Scale Behavior

output_fraction is scale-invariant: multiplying both `input` and `output` by
the same constant leaves output_fraction unchanged. This makes it more robust
to request scale than Yield or Leverage.

**Sensitivity factors:**
- **Output verbosity:** More output increases output_fraction (but may indicate
  verbosity, not quality)
- **Input minimization:** Smaller fresh input increases output_fraction
- **Task type:** Code generation vs. explanation tasks produce different ratios
- **Model choice:** Different models produce different output lengths for the
  same input

## Gaming Opportunities

1. **Maximize output verbosity:** Generate unnecessarily long responses →
   inflates output_fraction
2. **Minimize fresh input:** Send very short prompts → inflates output_fraction
3. **Window manipulation:** Choose observation windows that maximize the ratio

**Anti-gaming is a platform-layer concern, not a protocol concern.**

## Worked Examples

### Example 1: MOSES canonical seed
```
input = 1,251,211
output = 11,296,121

F = 11,296,121 / (1,251,211 + 11,296,121)
F = 11,296,121 / 12,547,332
F = 0.9003
```

### Example 2: Zero output
```
input = 1000, output = 0
F = 0 / (1000 + 0) = 0 / 1000 = 0.0000
```

### Example 3: Zero both
```
input = 0, output = 0
F = null (undefined — input + output = 0)
```

## Boundary Test Vectors

| Vector | input | output | Expected F |
|--------|-------|--------|------------|
| canonical-moses | 1251211 | 11296121 | 0.9003 |
| zero-output | 1000 | 0 | 0.0000 |
| zero-both | 0 | 0 | null |

## What output_fraction Measures

The fraction of total token flow that is output. A higher value means more of
the token flow is output rather than input.

## What output_fraction Does NOT Measure

- Signal-to-noise ratio in any signal-processing sense
- Output quality or usefulness
- Whether output is verbose or concise
- Code quality, task correctness, or productivity

## Rounding

4 decimal places, round-half-to-even (banker's rounding).

## Legacy Alias

`snr` (accepted in schema and conformance runners; deprecated as a name)

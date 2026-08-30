# Velocity

**Metric ID:** `tteop.velocity`
**Maturity:** Experimental
**Spec section:** SPEC.md §26.3

---

## Formula

```
V = output / input
```

## Construct

Velocity measures how much output an operator generates relative to the fresh input they provide. Higher values indicate more output per unit of fresh input.

## Valid Domain

`[0, +∞)` — Velocity is always non-negative when defined.

## Division-by-Zero Behavior

- `input = 0` → Velocity is `null` (undefined)

## Missing-Field Behavior

| Field missing | Velocity behavior |
|---------------|-------------------|
| `cache_read` is null | Velocity is computable (does not require cache fields) |
| `cache_write` is null | Velocity is computable |
| `input` is null | Schema violation |

Velocity is the only metric (besides output_fraction) that does not require cache fields. This makes it useful for providers that do not expose cache telemetry.

## Dimensional and Scale Behavior

- **Linear in output:** Doubling output doubles Velocity
- **Inverse in input:** Doubling input halves Velocity
- **Task type sensitivity:** Code generation vs. explanation tasks produce different ratios
- **Output verbosity:** High Velocity may indicate verbose, low-quality output

## Gaming Opportunities

1. **Minimize fresh input:** Very short prompts
2. **Maximize output verbosity:** Generate unnecessarily long responses
3. **Task selection:** Choose tasks that naturally produce high output/input ratios

## Worked Examples

### MOSES canonical seed
```
V = 11,296,121 / 1,251,211 = 9.028
```

### Zero output
```
V = 0 / 1000 = 0.000
```

## Boundary Test Vectors

| Vector | input | output | Expected V |
|--------|-------|--------|------------|
| canonical-moses | 1251211 | 11296121 | 9.028 |
| zero-output | 1000 | 0 | 0.000 |
| zero-input | 0 | 500 | null |

## What Velocity Measures

Output generation relative to fresh input. Higher values indicate more output per unit of fresh input.

## What Velocity Does NOT Measure

- Output quality or usefulness
- Task success
- Whether the output was helpful or correct

## Rounding

3 decimal places, round-half-to-even.

## Legacy Alias

`velocity`

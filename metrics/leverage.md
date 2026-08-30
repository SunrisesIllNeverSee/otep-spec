# Leverage

**Metric ID:** `tteop.leverage`
**Maturity:** Experimental
**Spec section:** SPEC.md §26.2

---

## Formula

```
L = cache_read / input
```

## Construct

Leverage measures how much cached context an operator reuses relative to the fresh input they provide. Higher values indicate greater cache utilization.

## Valid Domain

`[0, +∞)` — Leverage is always non-negative when defined.

## Division-by-Zero Behavior

- `input = 0` → Leverage is `null` (undefined)
- `cache_read = null` → Leverage is `null` (undefined)

## Missing-Field Behavior

| Field missing | Leverage behavior |
|---------------|-------------------|
| `cache_read` is null | Leverage = null |
| `cache_write` is null | Leverage is computable (does not require cache_write) |
| `input` is null | Schema violation |

## Dimensional and Scale Behavior

- **Linear in cache_read:** Doubling cache_read doubles Leverage
- **Inverse in input:** Doubling input halves Leverage
- **Provider sensitivity:** Providers with aggressive caching produce higher Leverage
- **Not comparable across providers** without adapter disclosure

## Gaming Opportunities

1. **Minimize fresh input:** Very short prompts with large cached context
2. **Provider selection:** Choose providers with more aggressive caching policies
3. **Cache padding:** Write large blocks to cache and read them back

## Worked Examples

### MOSES canonical seed
```
L = 2,555,179,769 / 1,251,211 = 2042.2
```

### Zero cache_read
```
L = 0 / 1000 = 0.0
```

## Boundary Test Vectors

| Vector | input | cache_read | Expected L |
|--------|-------|------------|------------|
| canonical-moses | 1251211 | 2555179769 | 2042.2 |
| zero-cache-read | 1000 | 0 | 0.0 |
| zero-input | 0 | 1000 | null |
| missing-cache-read | 1000 | null | null |

## What Leverage Measures

Cache reuse relative to fresh input. Higher values indicate greater cache utilization.

## What Leverage Does NOT Measure

- Output quality or task efficiency
- Skill or productivity
- Whether cached context is actually useful

## Rounding

1 decimal place, round-half-to-even.

## Legacy Alias

`leverage`

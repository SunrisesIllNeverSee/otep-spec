# log_leverage (D)

**Metric ID:** `otep.log_leverage`
**Maturity:** Experimental
**Spec section:** SPEC.md §26.5
**Legacy alias:** `dev10x` (deprecated — see §Naming note)

---

## Formula

```
D = log10(cache_read / input) = log10(Leverage)
```

## Construct

log_leverage is the base-10 logarithm of Leverage. It compresses the wide
dynamic range of Leverage (which can span several orders of magnitude) into a
more interpretable scale. A value of 3 means the operator read 1000× more
tokens from cache than they sent as fresh input.

## Naming note

This metric was formerly named "10xDEV" / `dev10x`. That name is **deprecated**
because it implies a "10x developer" productivity classification, which the
protocol explicitly disclaims (SRP-NON-001). The metric measures cache-reuse
leverage on a log scale; it does not measure developer productivity.

The "10xDEV" label is retained as an **application-profile alias** in
`profiles/application/dev10x.md`, where it is bound to explicit limitations and
prohibited from employment-use contexts. The normative metric name is
`log_leverage`.

The frozen invariant value `3.31` for the MOSES canonical seed vector is
preserved; only the name changes.

## Reference-implementation policy

The reference implementation requires **all four pillars > 0** (input, output,
cache_write, cache_read) before computing log_leverage. This is stricter than
the mathematical requirement (only `input > 0` and `cache_read > 0` are needed
for `log10(cache_read / input)`). The stricter policy exists because:

1. log_leverage is intended as a cascade metric that characterizes the full
   I/O/W/R flow; partial data produces a less meaningful log scale.
2. Consistency with the frozen MOSES seed computation, which has all four
   pillars > 0.

Implementations MAY compute log_leverage with only `input > 0` and
`cache_read > 0` if they document the deviation. The conformance suite tests
the stricter policy.

## Valid Domain

`(-∞, +∞)` — log_leverage can be negative (when cache_read < input) or
positive (when cache_read > input).

## Division-by-Zero Behavior

- `input = 0` → log_leverage is `null` (undefined)
- `cache_read = null` (missing/unsupported) → log_leverage is `null`
- `cache_read = 0` (and input > 0) → `log10(0) = -∞`; the reference
  implementation returns `null` (per the all-four-pillars > 0 policy)
- Any of `input`, `output`, `cache_write`, `cache_read` is zero → `null`
  (reference-implementation policy)

## Missing-Field Behavior

| Field missing | log_leverage behavior |
|---------------|------------------------|
| `cache_read` is null | log_leverage = null |
| `cache_write` is null | log_leverage = null (reference-implementation policy) |
| `input` is null | Schema violation (input MUST NOT be null) |
| `output` is null | Schema violation (output MUST NOT be null) |

## Dimensional and Scale Behavior

log_leverage is the log of a ratio, so it is invariant under multiplication of
both `cache_read` and `input` by the same constant. However, it is sensitive to
the ratio itself:

- Doubling `cache_read` (holding `input` constant) adds `log10(2) ≈ 0.301` to
  log_leverage
- Doubling `input` (holding `cache_read` constant) subtracts `log10(2) ≈ 0.301`
  from log_leverage

**Sensitivity factors:**
- **Caching policy:** Providers with aggressive caching produce higher
  log_leverage
- **Context length:** Longer uncached contexts reduce log_leverage
- **Model choice:** Different models have different caching policies
- **Task type:** Tasks that reuse cached context produce higher log_leverage

## Gaming Opportunities

1. **Minimize fresh input:** Send very short prompts with large cached context
   → inflates log_leverage
2. **Cache padding:** Write large blocks to cache and read them back → inflates
   cache_read
3. **The "10x" name may incentivize gaming to reach a threshold** (e.g.,
   "I want to be a 10x developer") — this is why the normative name is
   `log_leverage`, not `10xDEV`

**Anti-gaming is a platform-layer concern, not a protocol concern.**

## Worked Examples

### Example 1: MOSES canonical seed
```
input = 1,251,211
output = 11,296,121
cache_write = 128,196,310
cache_read = 2,555,179,769

D = log10(2,555,179,769 / 1,251,211)
D = log10(2042.2)
D = 3.31
```

### Example 2: Zero cache_write
```
input = 1000, output = 500, cache_write = 0, cache_read = 1000
D = null (reference-implementation policy: all four pillars must be > 0)
```

### Example 3: Missing cache
```
input = 1000, output = 500, cache_write = null, cache_read = null
D = null (cache fields unavailable)
```

## Boundary Test Vectors

| Vector | input | output | cache_write | cache_read | Expected D |
|--------|-------|--------|-------------|------------|------------|
| canonical-moses | 1251211 | 11296121 | 128196310 | 2555179769 | 3.31 |
| zero-cache-write | 1000 | 500 | 0 | 1000 | null |
| zero-output | 1000 | 0 | 200 | 1000 | null |
| missing-cache | 1000 | 500 | null | null | null |

## What log_leverage Measures

Logarithmic scale of cache-reuse leverage. Compresses the wide dynamic range of
Leverage into a more interpretable scale.

## What log_leverage Does NOT Measure

- Developer productivity or "10x" classification
- Code quality, task correctness, or skill
- Causal improvement from an AI tool
- Employee performance or business impact

## Rounding

2 decimal places, round-half-to-even (banker's rounding).

## Legacy Alias

`dev10x` (accepted in schema and conformance runners; deprecated as a name).
The "10xDEV" label is retained only as an application-profile alias in
`profiles/application/dev10x.md`.

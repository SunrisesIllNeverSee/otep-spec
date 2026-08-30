# Yield (Υ)

**Metric ID:** `otep.yield`
**Maturity:** Experimental
**Spec section:** SPEC.md §26.1

---

## Formula

```
Υ = (cache_read × output) / input²
```

**Equivalent:** `Υ = Leverage × Velocity`

## Construct

Yield is a composite signal that combines cache reuse (Leverage) and output generation (Velocity). It rewards operators who both maximize cached context reuse and generate substantial output relative to fresh input.

## Valid Domain

`[0, +∞)` — Yield is always non-negative when defined.

## Division-by-Zero Behavior

- `input = 0` → Yield is `null` (undefined)
- `cache_read = null` (missing/unsupported) → Yield is `null` (undefined)

## Missing-Field Behavior

| Field missing | Yield behavior |
|---------------|----------------|
| `cache_read` is null | Yield = null |
| `cache_write` is null | Yield is computable (does not require cache_write) |
| `input` is null | Schema violation (input MUST NOT be null) |
| `output` is null | Schema violation (output MUST NOT be null) |

## Dimensional and Scale Behavior

**Critical limitation:** Yield is quadratically sensitive to input scale because `input` appears squared in the denominator.

- Doubling `input` (while holding `output` and `cache_read` constant) quarters Yield
- Doubling both `input` and `output` (same ratio) halves Yield if `cache_read` is constant
- This makes Yield non-monotonic in a way that is difficult to interpret across different request scales

**Sensitivity factors:**
- **Context length:** Longer uncached contexts reduce Yield
- **Output verbosity:** More output increases Yield (but may indicate verbosity, not quality)
- **Model choice:** Different models have different caching policies, affecting Yield
- **Task type:** Code generation vs. explanation tasks produce different token ratios
- **Caching policy:** Provider caching policy changes cause artificial Yield shifts
- **Observation-window size:** Larger windows aggregate more tokens, potentially changing the ratio

## Gaming Opportunities

1. **Minimize fresh input:** Send very short prompts with large cached context → inflates Yield
2. **Maximize output verbosity:** Generate unnecessarily long responses → inflates Yield
3. **Cache padding:** Write large blocks to cache and read them back → inflates cache_read
4. **Window manipulation:** Choose observation windows that maximize the ratio

**Anti-gaming is a platform-layer concern (SignalAF), not a protocol concern.** The protocol defines the metric; platforms define eligibility and abuse detection.

## Worked Examples

### Example 1: MOSES canonical seed
```
input = 1,251,211
output = 11,296,121
cache_write = 128,196,310
cache_read = 2,555,179,769

Υ = (2,555,179,769 × 11,296,121) / 1,251,211²
Υ = 28,870,022,388,647,249 / 1,565,529,638,652,121
Υ = 18,436.98
```

### Example 2: Zero cache_read
```
input = 1000, output = 500, cache_read = 0
Υ = (0 × 500) / 1000² = 0 / 1,000,000 = 0.00
```

### Example 3: Missing cache_read
```
input = 1000, output = 500, cache_read = null
Υ = null (undefined)
```

## Boundary Test Vectors

| Vector | input | output | cache_read | Expected Υ |
|--------|-------|--------|------------|------------|
| canonical-moses | 1251211 | 11296121 | 2555179769 | 18436.98 |
| zero-cache-read | 1000 | 500 | 0 | 0.00 |
| zero-input | 0 | 500 | 1000 | null |
| missing-cache-read | 1000 | 500 | null | null |
| zero-output | 1000 | 0 | 1000 | 0.00 |

## What Yield Measures

A composite signal combining cache reuse and output generation efficiency. Higher values indicate more output per unit of fresh input, amplified by cache reuse.

## What Yield Does NOT Measure

- Code quality
- Task correctness or success
- Productivity
- Professional skill
- Employee performance
- Business impact
- Causal improvement from an AI tool

## Rounding

2 decimal places, round-half-to-even (banker's rounding).

## Legacy Alias

`yield` (accepted in schema and conformance runners)

# Normalization Profiles

**Document status:** Informative (v0.1-draft)
**Spec version:** otep/0.1-draft

---

## 1. Purpose

The core OTEP metrics (Yield, Leverage, Velocity, output_fraction, log_leverage)
are defined with fixed formulas in `metrics/registry.json`. Some metrics,
particularly Yield (Υ), have known scale sensitivities that make cross-window
or cross-operator comparison difficult without normalization.

Normalization profiles are **optional** layers that transform core metrics for
specific comparison contexts. They do NOT replace the core metrics — they
build on top of them. A normalization profile MUST NOT alter the core metric
values; it produces additional derived values.

---

## 2. Yield Scale Sensitivity

Yield (Υ) = `(cache_read × output) / input²` is quadratically sensitive to
`input` because `input` appears squared in the denominator:

- Doubling `input` (holding `output` and `cache_read` constant) quarters Υ
- Doubling both `input` and `output` (same ratio) halves Υ if `cache_read` is
  constant
- This makes Υ non-monotonic in a way that is difficult to interpret across
  different request scales

This is a structural property of the formula (Υ = Leverage × Velocity), not an
arbitrary design choice. The quadratic sensitivity arises because both
Leverage (`cache_read / input`) and Velocity (`output / input`) have `input`
in the denominator.

---

## 3. Proposed Normalization Profiles

### 3.1 Window-Normalized Yield (Υ_w)

**Profile ID:** `norm.window-yield`
**Maturity:** experimental
**Status:** Proposed for v0.2; not normative in v0.1

**Formula:**

```
Υ_w = Υ × (input / median_input_cohort)
```

Where `median_input_cohort` is the median `input` value across all operators
in the comparison cohort for the same observation window.

**Construct:** Adjusts Yield to account for differences in input scale across
operators. An operator with above-median input gets a boost; an operator with
below-median input gets a penalty. This partially compensates for the
quadratic input sensitivity.

**Valid domain:** `[0, +∞)` (same as Yield)

**Limitations:**
- Requires cohort data (not available in public-pseudonymous mode without a
  reference cohort)
- Median is sensitive to cohort composition
- Does not fully eliminate scale sensitivity (only partially compensates)

**Prohibited interpretation:** Same as Yield — must not be presented as proof
of code quality, productivity, or task success.

### 3.2 Linear-Input Yield (Υ_lin) — Alternative Formula

**Profile ID:** `norm.linear-input-yield`
**Maturity:** experimental
**Status:** Proposed for v0.2; not normative in v0.1. Retained as Υ as the
frozen invariant.

**Formula:**

```
Υ_lin = (cache_read × output) / input
```

**Construct:** A linear-input variant of Yield that removes the quadratic
sensitivity. This is equivalent to `Leverage × output` (not `Leverage ×
Velocity`).

**Valid domain:** `[0, +∞)`

**Scale behavior:** Linear in `input` — doubling `input` halves Υ_lin (not
quarters it). This makes cross-scale comparison more interpretable.

**Relationship to Υ:** `Υ_lin = Υ × input`. The two metrics are related by a
factor of `input`, so Υ_lin is not a replacement but a complementary metric.

**Why not replace Υ?**
1. The frozen MOSES seed invariant (Υ = 18436.98) is a stability anchor.
   Changing the formula would break this invariant.
2. Υ is classified as `experimental`, allowing formula changes in future
   versions. However, the v0.1-draft retains Υ for continuity.
3. Υ_lin can be registered as a new metric in v0.2 via the OEP process.

**Test vector (MOSES canonical seed):**

```
input = 1,251,211
output = 11,296,121
cache_read = 2,555,179,769

Υ_lin = (2,555,179,769 × 11,296,121) / 1,251,211
Υ_lin = 28,870,022,388,647,249 / 1,251,211
Υ_lin = 23,076,548,060.6
```

### 3.3 Sqrt-Input Yield (Υ_sqrt) — Alternative Formula

**Profile ID:** `norm.sqrt-input-yield`
**Maturity:** experimental
**Status:** Proposed for v0.2; not normative in v0.1

**Formula:**

```
Υ_sqrt = (cache_read × output) / input^1.5
```

**Construct:** A compromise between Υ (quadratic) and Υ_lin (linear). The
exponent 1.5 reduces scale sensitivity without eliminating it entirely.

**Valid domain:** `[0, +∞)`

**Scale behavior:** Doubling `input` reduces Υ_sqrt by a factor of `2^1.5 ≈
2.83` (between Υ's factor of 4 and Υ_lin's factor of 2).

**Relationship to Υ:** `Υ_sqrt = Υ × input^0.5 = Υ × √input`.

**Test vector (MOSES canonical seed):**

```
Υ_sqrt = 18436.98 × √1,251,211 = 18436.98 × 1118.6 = 20,623,140.3
```

### 3.4 Log Yield (log_Υ)

**Profile ID:** `norm.log-yield`
**Maturity:** experimental
**Status:** Proposed for v0.2; not normative in v0.1

**Formula:**

```
log_Υ = log10(Υ) = log10(Leverage × Velocity) = log10(Leverage) + log10(Velocity)
```

**Construct:** Logarithmic compression of Yield. Compresses the wide dynamic
range (Υ can span several orders of magnitude) into a more interpretable
scale. A value of 4.27 means Υ ≈ 18,437.

**Valid domain:** `(-∞, +∞)` (undefined when Υ is null or ≤ 0)

**Scale behavior:** Logarithmic — doubling Υ adds `log10(2) ≈ 0.301` to
log_Υ. This makes the metric more robust to scale differences.

**Relationship to log_leverage:** `log_Υ = log_leverage + log10(Velocity)`.
This decomposition shows that log_Υ is the sum of cache-reuse leverage and
output generation, both on log scales.

**Test vector (MOSES canonical seed):**

```
log_Υ = log10(18436.98) = 4.27
```

---

## 4. Decision Framework

| Profile | When to use | Maturity | OEP required? |
|---------|-------------|----------|---------------|
| Core Υ | Default; frozen invariant | experimental | No (already registered) |
| Υ_w (window-normalized) | Cross-operator comparison within a cohort | experimental | Yes (v0.2) |
| Υ_lin (linear-input) | When quadratic sensitivity is problematic | experimental | Yes (v0.2) |
| Υ_sqrt (sqrt-input) | Compromise between Υ and Υ_lin | experimental | Yes (v0.2) |
| log_Υ (log yield) | When dynamic range is too wide | experimental | Yes (v0.2) |

---

## 5. Implementation Notes

- Normalization profiles are NOT part of the v0.1-draft conformance suite.
  They are proposed for v0.2 and require OEP acceptance before becoming
  normative.
- A conforming implementation MAY implement normalization profiles as
  extensions, but MUST NOT claim conformance to them until they are registered.
- The core Υ formula is frozen for v0.1-draft. Changing it requires a major
  version increment (per SRP-COMP-005 for stable metrics, though Υ is
  experimental and may change in minor versions).
- Normalization profiles MUST NOT alter the core metric values stored in the
  `metrics` object. They produce additional derived values in `extensions`.

---

## 6. Open Questions

1. **Should Υ_lin replace Υ in v1.0?** This is a measurement-science decision
   that requires implementation experience. The v0.1-draft retains Υ and
   proposes Υ_lin as an alternative.

2. **Should log_Υ be a core metric?** It has attractive properties (log
   scale, decomposable into log_leverage + log_velocity) but adds complexity.

3. **How should cohort-dependent normalization (Υ_w) handle privacy modes?**
   Window-normalized Yield requires cohort data, which may not be available
   in public-pseudonymous mode without a reference cohort.

These questions are tracked in `UNRESOLVED-DECISIONS.md` and will be resolved
through the OEP process before v0.5.

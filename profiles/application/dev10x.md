# 10xDEV Application Profile

**Status:** Optional application profile (NOT normative core)
**Maturity:** Experimental
**Spec version:** tteop/0.1-draft

---

## Important Disclaimer

The "10xDEV" label is an **application profile alias**, not a normative metric name. The normative metric is `log_leverage` (`tteop.log_leverage`). The "10xDEV" name is retained for backward compatibility with existing product surfaces but MUST NOT be used in normative protocol contexts.

**The "10xDEV" label MUST NOT be presented as:**
- A developer productivity classification
- A "10x developer" certification
- Proof of professional skill or employee performance
- A hiring or compensation criterion

---

## Definition

**Application profile name:** 10xDEV
**Underlying metric:** `tteop.log_leverage` (`log10(cache_read / input)`)
**Formula:** `10xDEV = log10(R / I)`

## Minimum Evidence Requirements

To use the "10xDEV" label in any public-facing context:

1. **All four pillars MUST be positive:** `input > 0`, `output > 0`, `cache_write > 0`, `cache_read > 0`
2. **Observation window MUST be disclosed:** The window granularity and duration must be stated
3. **Provider and adapter MUST be identified:** The source provider and adapter version must be declared
4. **Provenance level MUST be disclosed:** Self-reported, collector-attested, platform-verified, or signed
5. **The underlying metric name (`log_leverage`) MUST be used in normative contexts**

## Prohibitions

1. **No employment use:** The 10xDEV label MUST NOT be used as the sole or primary basis for employment decisions (hiring, firing, promotion, compensation, performance review).
2. **No causal claims:** The 10xDEV label MUST NOT be presented as causing any outcome (productivity, quality, business impact).
3. **No absolute ranking without context:** A 10xDEV value MUST NOT be presented as an absolute ranking without disclosing the reference field, eligibility criteria, and observation window.
4. **No misrepresentation:** The 10xDEV label MUST NOT be presented as a normative TTEOP metric. It is an application profile alias.

## Classification Bands (SignalAF Reference)

The following bands are **SignalAF reference extensions**, not TTEOP normative requirements:

| Band | log_leverage range | Label |
|------|-------------------|-------|
| — | < 1.0 | Entry |
| — | 1.0 – 2.0 | Practitioner |
| — | 2.0 – 3.0 | Advanced |
| — | 3.0 – 4.0 | Expert |
| — | > 4.0 | Elite |

These bands are defined by SignalAF and MAY change. They are NOT part of the TTEOP specification.

## Relationship to log_leverage

```
10xDEV = log_leverage = log10(cache_read / input) = log10(Leverage)
```

The frozen MOSES seed invariant: `log10(2555179769 / 1251211) = 3.31`

The legacy alias `dev10x` is accepted in schema and conformance runners for backward compatibility.

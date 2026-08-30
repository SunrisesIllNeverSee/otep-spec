#!/usr/bin/env python3
"""
integrations/python/example.py

Minimal Python implementation of the OTEP v0.1-draft
five-metric portable core. No dependencies.

A conforming implementation MUST produce the same results as the
conformance suite test vectors for the same inputs.
"""

import math
from datetime import datetime, timezone
from typing import Optional


def _round(n: Optional[float], d: int) -> Optional[float]:
    if n is None or not math.isfinite(n):
        return None
    return round(n, d)


def compute_metrics(
    input_tokens: int,
    output_tokens: int,
    cache_write: Optional[int] = None,
    cache_read: Optional[int] = None,
) -> dict:
    """Compute the five portable metrics from four token pillars."""
    warnings = []
    cache_warnings = []

    # output_fraction = output / (input + output)
    of_denom = input_tokens + output_tokens
    of_raw = output_tokens / of_denom if of_denom > 0 else None
    if of_raw is None:
        warnings.append("output_fraction_undefined: input+output=0")

    # Velocity = output / input
    velocity = output_tokens / input_tokens if input_tokens > 0 else None
    if velocity is None:
        warnings.append("velocity_undefined: input=0")

    # Leverage = cache_read / input
    leverage = None
    if cache_read is None:
        pass  # unavailable → null
    elif input_tokens > 0:
        leverage = cache_read / input_tokens
    else:
        warnings.append("leverage_undefined: input=0")

    # Yield = leverage × velocity
    y = None
    if cache_read is None:
        pass  # unavailable → null
    elif leverage is not None and velocity is not None:
        y = leverage * velocity
    else:
        warnings.append("yield_undefined: requires input>0 and cache_read available")

    # Cache-unavailable warnings (emitted before metric-specific undefined warnings
    # per SRP-METRIC-006 ordering: cache-unavailable before metric-undefined)
    if cache_write is None:
        cache_warnings.append("cache_write is unavailable; log_leverage is undefined.")
    if cache_read is None:
        cache_warnings.append("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.")

    # log_leverage = log10(R / I) — requires all four pillars > 0
    all_four_positive = (
        input_tokens > 0 and output_tokens > 0 and
        cache_write is not None and cache_write > 0 and
        cache_read is not None and cache_read > 0
    )
    log_lev = None
    if not all_four_positive:
        warnings.append("log_leverage_undefined: requires all four pillars > 0")
    else:
        log_lev = math.log10(cache_read / input_tokens)

    # Reorder: cache-unavailable first, then metric-undefined (SRP-METRIC-006)
    ordered_warnings = cache_warnings + warnings

    return {
        "metrics": {
            "yield": _round(y, 2),
            "leverage": _round(leverage, 1),
            "velocity": _round(velocity, 3),
            "output_fraction": _round(of_raw, 4),
            "log_leverage": _round(log_lev, 2),
        },
        "warnings": ordered_warnings,
    }


def build_record(
    input_tokens: int,
    output_tokens: int,
    cache_write: Optional[int] = None,
    cache_read: Optional[int] = None,
    provider: str = "unknown",
    model: str = "unknown",
    tool: str = "unknown",
) -> dict:
    """Build a complete OTEP v0.1-draft record."""
    result = compute_metrics(input_tokens, output_tokens, cache_write, cache_read)
    return {
        "spec": "otep/0.1-draft",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": {"provider": provider, "model": model, "tool": tool},
        "telemetry": {
            "input": input_tokens,
            "output": output_tokens,
            "cache_write": cache_write,
            "cache_read": cache_read,
        },
        "metrics": result["metrics"],
        "warnings": result["warnings"],
    }


if __name__ == "__main__":
    # Canonical reference: MOSES seed values
    record = build_record(
        input_tokens=1251211,
        output_tokens=11296121,
        cache_write=128196310,
        cache_read=2555179769,
        provider="anthropic",
        model="claude-sonnet-4",
        tool="claude-code",
    )
    import json
    print(json.dumps(record, indent=2))

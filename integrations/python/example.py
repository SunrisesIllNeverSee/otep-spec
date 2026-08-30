#!/usr/bin/env python3
"""
integrations/python/example.py

Minimal Python implementation of the TTEOP v0.1-draft
five-metric portable core + schema-conforming envelope builder.
No dependencies.

A conforming implementation MUST produce envelopes that validate
against schemas/telemetry-envelope-v0.1.schema.json.
"""

import json
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

    of_denom = input_tokens + output_tokens
    of_raw = output_tokens / of_denom if of_denom > 0 else None
    if of_raw is None:
        warnings.append("output_fraction_undefined: input+output=0")

    velocity = output_tokens / input_tokens if input_tokens > 0 else None
    if velocity is None:
        warnings.append("velocity_undefined: input=0")

    leverage = None
    if cache_read is None:
        pass
    elif input_tokens > 0:
        leverage = cache_read / input_tokens
    else:
        warnings.append("leverage_undefined: input=0")

    y = None
    if cache_read is None:
        pass
    elif leverage is not None and velocity is not None:
        y = leverage * velocity
    else:
        warnings.append("yield_undefined: requires input>0 and cache_read available")

    if cache_write is None:
        cache_warnings.append("cache_write is unavailable; log_leverage is undefined.")
    if cache_read is None:
        cache_warnings.append("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.")

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


def build_envelope(
    input_tokens: int,
    output_tokens: int,
    cache_write: Optional[int] = None,
    cache_read: Optional[int] = None,
    *,
    tool: str = "unknown",
    platform: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    adapter_id: Optional[str] = None,
    adapter_version: Optional[str] = None,
    privacy_mode: str = "public-pseudonymous",
    provenance_level: str = "self-reported",
    window_start: Optional[str] = None,
    window_end: Optional[str] = None,
    window_duration_seconds: Optional[int] = None,
) -> dict:
    """Build a schema-conforming TTEOP v0.1-draft envelope."""
    result = compute_metrics(input_tokens, output_tokens, cache_write, cache_read)
    return {
        "protocol_version": "tteop/0.1-draft",
        "metric_spec_version": "tteop-metrics/0.1-draft",
        "observation": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "window_start": window_start,
            "window_end": window_end,
            "window_duration_seconds": window_duration_seconds,
        },
        "source": {
            "tool": tool,
            "platform": platform,
            "provider": provider,
            "model": model,
            "adapter_id": adapter_id,
            "adapter_version": adapter_version,
        },
        "telemetry": {
            "input": input_tokens,
            "output": output_tokens,
            "cache_write": cache_write,
            "cache_read": cache_read,
        },
        "provenance": {
            "level": provenance_level,
            "signature_status": "unsigned",
        },
        "privacy": {
            "mode": privacy_mode,
        },
        "metrics": result["metrics"],
        "warnings": result["warnings"],
    }


# Backward-compatible alias
build_record = build_envelope


if __name__ == "__main__":
    envelope = build_envelope(
        input_tokens=1251211,
        output_tokens=11296121,
        cache_write=128196310,
        cache_read=2555179769,
        tool="claude-code",
        provider="anthropic",
        model="claude-sonnet-4",
    )
    print(json.dumps(envelope, indent=2))

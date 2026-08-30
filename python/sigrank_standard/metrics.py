"""
Metric computation for OTEP v0.1-draft (Operator Token Efficiency Protocol).

Implements the five portable metrics from four token pillars (I/O/W/R).
Conforms to the otep/0.1-draft specification. Metric names and warning text
match the JS reference implementation (reference/otep.mjs) byte-for-byte.
"""

import math
from datetime import datetime, timezone
from typing import Optional


def _round(n: Optional[float], d: int) -> Optional[float]:
    """Round to d decimal places, returning None for non-finite values."""
    if n is None or not math.isfinite(n):
        return None
    return round(n, d)


def compute_metrics(
    input_tokens: int,
    output_tokens: int,
    cache_write: Optional[int] = None,
    cache_read: Optional[int] = None,
) -> dict:
    """
    Compute the five portable metrics from four token pillars.

    Args:
        input_tokens:  Number of input (prompt) tokens.
        output_tokens: Number of output (completion) tokens.
        cache_write:   Number of cache-write (cache_creation) tokens, or None.
        cache_read:    Number of cache-read tokens, or None.

    Returns:
        dict with 'metrics' and 'warnings' keys.
        metrics: {yield, leverage, velocity, output_fraction, log_leverage} — each float or None.
        warnings: list of str explaining any None values.

    Warning ordering (SRP-METRIC-006): cache-unavailable warnings first,
    then metric-undefined warnings.
    """
    warnings = []
    cache_warnings = []

    # output_fraction = output / (input + output)
    of_denom = input_tokens + output_tokens
    of_raw = output_tokens / of_denom if of_denom > 0 else None
    if of_raw is None:
        warnings.append("output_fraction_undefined: input+output=0")

    # Velocity = output / input
    velocity_raw = output_tokens / input_tokens if input_tokens > 0 else None
    if velocity_raw is None:
        warnings.append("velocity_undefined: input=0")

    # Leverage = cache_read / input — None when cache_read is unavailable
    leverage_raw = None
    if cache_read is None:
        pass  # unavailable → None
    elif input_tokens > 0:
        leverage_raw = cache_read / input_tokens
    else:
        warnings.append("leverage_undefined: input=0")

    # Yield = (cache_read × output) / input² = Leverage × Velocity
    y_raw = None
    if cache_read is None:
        pass  # unavailable → None
    elif leverage_raw is not None and velocity_raw is not None:
        y_raw = leverage_raw * velocity_raw
    else:
        warnings.append("yield_undefined: requires input>0 and cache_read available")

    # Cache-unavailable warnings (emitted before metric-specific undefined warnings
    # per SRP-METRIC-006 ordering: cache-unavailable before metric-undefined)
    if cache_write is None:
        cache_warnings.append("cache_write is unavailable; log_leverage is undefined.")
    if cache_read is None:
        cache_warnings.append("cache_read is unavailable; Yield, Leverage, and log_leverage are undefined.")

    # log_leverage = log10(cache_read / input)
    # Reference implementation policy: requires all four pillars > 0
    all_four_positive = (
        input_tokens > 0 and output_tokens > 0 and
        cache_write is not None and cache_write > 0 and
        cache_read is not None and cache_read > 0
    )
    log_lev_raw = None
    if not all_four_positive:
        warnings.append("log_leverage_undefined: requires all four pillars > 0")
    else:
        log_lev_raw = math.log10(cache_read / input_tokens)

    # Reorder warnings: cache-unavailable first, then metric-undefined (SRP-METRIC-006)
    ordered_warnings = cache_warnings + warnings

    return {
        "metrics": {
            "yield": _round(y_raw, 2),
            "leverage": _round(leverage_raw, 1),
            "velocity": _round(velocity_raw, 3),
            "output_fraction": _round(of_raw, 4),
            "log_leverage": _round(log_lev_raw, 2),
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
    spec_version: str = "otep/0.1-draft",
    *,
    platform: Optional[str] = None,
    adapter_id: Optional[str] = None,
    adapter_version: Optional[str] = None,
    privacy_mode: str = "public-pseudonymous",
    provenance_level: str = "self-reported",
    window_start: Optional[str] = None,
    window_end: Optional[str] = None,
    window_duration_seconds: Optional[int] = None,
) -> dict:
    """
    Build a complete OTEP v0.1-draft telemetry envelope.

    Returns a dict conforming to schemas/telemetry-envelope-v0.1.schema.json:
        protocol_version, metric_spec_version, observation, source, telemetry,
        provenance, privacy, metrics, warnings.

    The spec_version parameter defaults to "otep/0.1-draft". Pass
    "sigrank/0.1-draft" for legacy compatibility.
    """
    result = compute_metrics(input_tokens, output_tokens, cache_write, cache_read)
    return {
        "protocol_version": spec_version,
        "metric_spec_version": "otep-metrics/0.1-draft",
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


# Schema-conforming alias
build_envelope = build_record

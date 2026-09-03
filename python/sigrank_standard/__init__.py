"""
sigrank-standard — Python implementation of the TTEOP v0.1-draft specification.

The portable five-metric core for AI operator token-processing efficiency.
No dependencies. Conforms to the tteop/0.1-draft specification.

Metrics:
    Yield           = (cache_read * output) / input^2
    Leverage        = cache_read / input
    Velocity        = output / input
    output_fraction = output / (input + output)
    log_leverage    = log10(cache_read / input)

Legacy aliases (deprecated, not emitted in default output):
    SNR    → output_fraction
    10xDEV → log_leverage

Null semantics:
    - When a denominator is zero, the metric is None (not 0 or Infinity).
    - When cache_read is None, Yield, Leverage, and log_leverage are None.
    - When cache_write is None, log_leverage is None.
"""

from .metrics import compute_metrics, build_record, build_envelope
from .conformance import run_conformance, ConformanceResult

__version__ = "0.1.5"
__spec__ = "tteop/0.1-draft"
__all__ = [
    "compute_metrics",
    "build_record",
    "build_envelope",
    "run_conformance",
    "ConformanceResult",
    "__version__",
    "__spec__",
]

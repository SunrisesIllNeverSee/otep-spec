# sigrank-standard (Python)

Portable five-metric core for AI operator token-processing efficiency.
Conforms to the OTEP v0.1-draft specification.

## Install

```bash
pip install sigrank-standard
```

## Usage

### Compute metrics

```python
from sigrank_standard import compute_metrics, build_record

# Four token pillars: input, output, cache_write, cache_read
result = compute_metrics(
    input_tokens=1_251_211,
    output_tokens=11_296_121,
    cache_write=128_196_310,
    cache_read=2_555_179_769,
)
print(result["metrics"])
# {'yield': 18436.98, 'leverage': 2042.2, 'velocity': 9.028, 'output_fraction': 0.9003, 'log_leverage': 3.31}
```

### Build a full record

```python
from sigrank_standard import build_record
import json

record = build_record(
    input_tokens=1_251_211,
    output_tokens=11_296_121,
    cache_write=128_196_310,
    cache_read=2_555_179_769,
    provider="anthropic",
    model="claude-sonnet-4",
    tool="claude-code",
)
print(json.dumps(record, indent=2))
```

### Run conformance suite

```bash
sigrank-conformance
# or
python -m sigrank_standard
```

## Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Yield (Υ) | `(cache_read * output) / input^2` | Token cascade efficiency |
| Leverage | `cache_read / input` | Context reuse |
| Velocity | `output / input` | Output amplification |
| output_fraction | `output / (input + output)` | Output share of total tokens |
| log_leverage | `log10(cache_read / input)` | Log-scaled context reuse |

Legacy aliases (deprecated): SNR → output_fraction, 10xDEV → log_leverage.

## Null semantics

- When a denominator is zero, the metric is `None` (not 0 or Infinity)
- When `cache_read` is `None`, Yield, Leverage, and log_leverage are `None`
- When `cache_write` is `None`, log_leverage is `None`

## Spec

OTEP v0.1-draft (Operator Token Efficiency Protocol). See [signalaf.com/standard](https://signalaf.com/standard).

## License

Apache-2.0

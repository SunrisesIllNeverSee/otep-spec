# Anthropic Provider Adapter

**Adapter ID:** `anthropic-v1`
**Provider:** Anthropic
**Supported API versions:** `2023-06-01`, `2024-10-22`
**Spec version:** otep/0.1-draft

---

## 1. Field mappings

| OTEP primitive | Native field | Notes |
|----------------|--------------|-------|
| `input` | `usage.input_tokens` | Fresh input tokens. Anthropic reports this as the count of non-cached input tokens. |
| `output` | `usage.output_tokens` | Completion tokens. |
| `cache_write` | `usage.cache_creation_input_tokens` | Tokens written to the prompt cache. |
| `cache_read` | `usage.cache_read_input_tokens` | Tokens read from the prompt cache. |

## 2. Double-counting policy

**Policy:** `none`

Anthropic exposes cache creation and cache read as separate fields, and
`input_tokens` represents fresh (non-cached) input. There is no
double-counting risk. No subtraction or anomaly flag is required.

## 3. Cache availability

- **Cache creation:** Exposed (`cache_creation_input_tokens`). Mapped to
  `cache_write`. Anthropic's modern API versions (2024-10-22 and later)
  always include this field. If the field is present with value `0`, set
  `cache_write` to `0` (the cache was available but no tokens were written).
  If the API version does not support cache creation (field entirely absent),
  set `cache_write` to `null` and include `cache_write_not_reported` in
  `validity.missingness_flags` (SRP-MISS-001, SRP-MISS-003). A value of `0`
  means "zero tokens written"; `null` means "field not reported." These are
  distinct states per SRP-TYPE-006.
- **Cache read:** Exposed (`cache_read_input_tokens`). Mapped to `cache_read`.
  Same null/zero semantics as cache creation: `0` = zero tokens read,
  `null` = field not reported (include `cache_read_not_reported` in
  `validity.missingness_flags`, SRP-MISS-002).

## 4. Workflow semantics

- **Retries:** Count tokens from the successful response only (SRP-ADAPT-008).
- **Streaming:** Aggregate `output_tokens` across all stream events into a
  single `output` count (SRP-ADAPT-009).
- **Batching:** Anthropic does not batch requests; each request is one
  envelope or summed into a window envelope.
- **Tool calls:** Sub-request tokens (from tool-use turns) are included in the
  operator's session total. The adapter sums all turns in the observation
  window.
- **Multi-model:** If a session uses multiple Anthropic models, emit one
  envelope per model (SRP-ADAPT-012 option a).

## 5. Test vectors

| ID | Description | Input | Output | Cache write | Cache read | Expected yield |
|----|-------------|-------|--------|-------------|------------|----------------|
| `anthropic-normal` | Normal case with all fields | 1251211 | 11296121 | 128196310 | 2555179769 | 18436.98 |
| `anthropic-no-cache` | Response without cache fields | 1000 | 500 | 0 | 0 | 0.0 |
| `anthropic-null-cache` | API version without cache support | 1000 | 500 | null | null | null |

## 6. Example native response

```json
{
  "usage": {
    "input_tokens": 1251211,
    "output_tokens": 11296121,
    "cache_creation_input_tokens": 128196310,
    "cache_read_input_tokens": 2555179769
  }
}
```

Maps to:

```json
{
  "telemetry": {
    "input": 1251211,
    "output": 11296121,
    "cache_write": 128196310,
    "cache_read": 2555179769
  }
}
```

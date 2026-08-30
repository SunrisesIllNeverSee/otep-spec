# OpenAI Provider Adapter

**Adapter ID:** `openai-v1`
**Provider:** OpenAI
**Supported API versions:** `2024-08-01`, `2024-10-01`
**Spec version:** tteop/0.1-draft

---

## 1. Field mappings

| TTEOP primitive | Native field | Notes |
|----------------|--------------|-------|
| `input` | `usage.prompt_tokens - usage.prompt_tokens_details.cached_tokens` | Fresh input = total prompt tokens minus cached tokens (see §2). |
| `output` | `usage.completion_tokens` | Completion tokens. |
| `cache_write` | Not exposed → `null` | OpenAI does not expose cache creation telemetry. |
| `cache_read` | `usage.prompt_tokens_details.cached_tokens` | Tokens served from the prompt cache. |

## 2. Double-counting policy

**Policy:** `subtract_cached_from_input` (SRP-ADAPT-003 option a)

OpenAI reports `cached_tokens` inside `prompt_tokens` (total input). To make
`input` represent fresh (uncached) tokens — the semantic intent of the TTEOP
`input` primitive — the adapter subtracts cached tokens from total prompt
tokens:

```
input = usage.prompt_tokens - usage.prompt_tokens_details.cached_tokens
```

If `prompt_tokens_details` or `cached_tokens` is absent, no subtraction is
performed: `input = prompt_tokens` (the full prompt count). The `cache_read`
field is set to `null` (not `0`) per §3 — "absent" means "not reported," not
"zero cache reads."

## 3. Cache availability

- **Cache creation:** NOT exposed. `cache_write` is always `null`, and
  `cache_write_unsupported` MUST be included in
  `validity.missingness_flags` (SRP-ADAPT-004).
- **Cache read:** Exposed via `prompt_tokens_details.cached_tokens`. Mapped to
  `cache_read`. If `prompt_tokens_details` or `cached_tokens` is absent, set
  `cache_read` to `null` (NOT `0`) and include `cache_read_not_reported` in
  `validity.missingness_flags` (SRP-MISS-002, SRP-MISS-003). A value of `0`
  means "the cache was queried but zero tokens were served from it"; `null`
  means "the provider did not report this field." These are distinct states
  per SRP-TYPE-006.

## 4. Workflow semantics

- **Retries:** Count tokens from the successful response only (SRP-ADAPT-008).
- **Streaming:** Aggregate `completion_tokens` across all stream chunks
  (SRP-ADAPT-009). OpenAI streaming responses include a final `usage` object
  with the total counts; prefer that over summing chunks.
- **Batching:** OpenAI does not batch requests in the standard API.
- **Tool calls:** Sub-request tokens (from tool calls) are included in the
  operator's session total.
- **Multi-model:** Emit one envelope per model (SRP-ADAPT-012 option a).

## 5. Test vectors

| ID | Description | prompt_tokens | cached_tokens | completion_tokens | Expected input | Expected cache_read | Expected yield |
|----|-------------|----------------|---------------|-------------------|----------------|---------------------|----------------|
| `openai-normal` | Normal case with cached tokens | 10000 | 1500 | 3200 | 8500 | 1500 | 0.07 |
| `openai-no-cache` | Response with cached_tokens=0 | 1000 | 0 | 500 | 1000 | 0 | 0.0 |
| `openai-null-cache` | No prompt_tokens_details | 1000 | (absent) | 500 | 1000 | null | null |

## 6. Example native response

```json
{
  "usage": {
    "prompt_tokens": 10000,
    "completion_tokens": 3200,
    "prompt_tokens_details": {
      "cached_tokens": 1500
    }
  }
}
```

Maps to:

```json
{
  "telemetry": {
    "input": 8500,
    "output": 3200,
    "cache_write": null,
    "cache_read": 1500
  },
  "validity": {
    "missingness_flags": ["cache_write_unsupported"]
  }
}
```

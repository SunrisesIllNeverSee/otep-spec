# Google Provider Adapter

**Adapter ID:** `google-v1`
**Provider:** Google (Gemini)
**Supported API versions:** `v1beta`, `v1`
**Spec version:** tteop/0.1-draft

---

## 1. Field mappings

| TTEOP primitive | Native field | Notes |
|----------------|--------------|-------|
| `input` | `usageMetadata.promptTokenCount` | Total prompt tokens. See §2 for double-counting. |
| `output` | `usageMetadata.candidatesTokenCount` | Completion tokens. |
| `cache_write` | Not exposed → `null` | Google does not expose cache creation telemetry. |
| `cache_read` | `usageMetadata.cachedContentTokenCount` | Tokens served from cached content. |

## 2. Double-counting policy

**Policy:** `provider_dependent` (SRP-ADAPT-003)

Google's `promptTokenCount` MAY or MAY NOT include `cachedContentTokenCount`
depending on the API version and request configuration. The adapter MUST
inspect the response to determine whether cached content tokens are included
in the prompt count:

- If the API documentation for the version/configuration states that
  `promptTokenCount` includes cached content, the adapter subtracts:
  `input = promptTokenCount - cachedContentTokenCount` (option a).
- If `promptTokenCount` excludes cached content, the adapter sets
  `input = promptTokenCount` directly.
- If uncertain, the adapter sets `input = promptTokenCount` and includes
  `input_includes_cached` in `validity.anomaly_flags` (option b), and
  `provider_field_mapping_uncertain` in `validity.missingness_flags`.

## 3. Cache availability

- **Cache creation:** NOT exposed. `cache_write` is always `null`, and
  `cache_write_unsupported` MUST be included in
  `validity.missingness_flags` (SRP-ADAPT-004).
- **Cache read:** Exposed via `cachedContentTokenCount` when cached content is
  used. Mapped to `cache_read`. If `cachedContentTokenCount` is absent from
  the response, set `cache_read` to `null` (NOT `0`) and include
  `cache_read_not_reported` in `validity.missingness_flags`
  (SRP-MISS-002, SRP-MISS-003). A value of `0` means "cached content was
  available but zero tokens were served from it"; `null` means "the provider
  did not report this field." These are distinct states per SRP-TYPE-006.

## 4. Workflow semantics

- **Retries:** Count tokens from the successful response only (SRP-ADAPT-008).
- **Streaming:** Aggregate `candidatesTokenCount` across all stream chunks
  (SRP-ADAPT-009). Google streaming responses include a final `usageMetadata`
  with totals; prefer that.
- **Batching:** Google does not batch requests in the standard API.
- **Tool calls:** Sub-request tokens are included in the operator's session
  total.
- **Multi-model:** Emit one envelope per model (SRP-ADAPT-012 option a).

## 5. Test vectors

| ID | Description | promptTokenCount | cachedContentTokenCount | candidatesTokenCount | Expected input | Expected cache_read | Missingness flags |
|----|-------------|-------------------|-------------------------|----------------------|----------------|---------------------|-------------------|
| `google-included` | promptTokenCount includes cached (subtract) | 10000 | 1500 | 3200 | 8500 | 1500 | `cache_write_unsupported` |
| `google-excluded` | promptTokenCount excludes cached (no subtract) | 10000 | 1500 | 3200 | 10000 | 1500 | `cache_write_unsupported` |
| `google-no-cache` | Response without cached content field | 1000 | (absent) | 500 | 1000 | null | `cache_write_unsupported`, `cache_read_not_reported` |
| `google-uncertain` | Uncertain inclusion (flag, no subtract) | 10000 | 1500 | 3200 | 10000 | 1500 | `cache_write_unsupported`; anomaly: `input_includes_cached`, missingness: `provider_field_mapping_uncertain` |

## 6. Example native response

```json
{
  "usageMetadata": {
    "promptTokenCount": 10000,
    "candidatesTokenCount": 3200,
    "cachedContentTokenCount": 1500
  }
}
```

Maps to (assuming `promptTokenCount` includes cached content):

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

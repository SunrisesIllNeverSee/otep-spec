# Provider Adapter Mapping Model

**Document status:** Normative (when an adapter conformance claim is made)
**Spec version:** otep/0.1-draft

This document defines the architecture for mapping provider-native
token-telemetry fields to OTEP canonical primitives. It is referenced by
SPEC.md §10.

---

## 1. The adapter problem

Providers expose token telemetry in different formats with different cache
semantics:

| Provider | Input field | Output field | Cache creation | Cache read |
|----------|-------------|--------------|----------------|------------|
| Anthropic | `usage.input_tokens` | `usage.output_tokens` | `usage.cache_creation_input_tokens` | `usage.cache_read_input_tokens` |
| OpenAI | `usage.prompt_tokens` | `usage.completion_tokens` | Not exposed | `usage.prompt_tokens_details.cached_tokens` |
| Google | `usageMetadata.promptTokenCount` | `usageMetadata.candidatesTokenCount` | Not exposed | `usageMetadata.cachedContentTokenCount` |

An **adapter** is a deterministic mapping from these native fields to the four
OTEP primitives (`input`, `output`, `cache_write`, `cache_read`). Adapters are
registered in `adapters/registry.json` and documented in per-provider files.

---

## 2. Mapping rules

**`SRP-ADAPT-001`** An adapter MUST map each provider-native token-count field
to exactly one OTEP primitive or declare it unmapped.

**`SRP-ADAPT-002`** An adapter MUST document how it handles providers that
report cached tokens inside total input (double-counting).

**`SRP-ADAPT-003`** When a provider reports cached tokens inside total input,
the adapter MUST either:
- (a) Set `input` to `total_input - cached_tokens` (preferred — `input`
  represents fresh tokens), OR
- (b) Set `input` to `total_input` and document that `input` includes cached
  tokens, with an `input_includes_cached` anomaly flag.

**`SRP-ADAPT-004`** When a provider exposes cache reads but not cache
creation, the adapter MUST set `cache_write` to `null` and include
`cache_write_unsupported` in `validity.missingness_flags`.

**`SRP-ADAPT-005`** When a provider exposes neither cache field, the adapter
MUST set both `cache_write` and `cache_read` to `null` and include both
`cache_write_unsupported` and `cache_read_unsupported` in
`validity.missingness_flags`.

**`SRP-ADAPT-007`** Custom adapters MUST NOT map non-token-count fields (cost,
latency, character counts) to OTEP primitives.

---

## 3. Workflow semantics

**`SRP-ADAPT-008`** Retries: count tokens from the successful response only.
If failed-attempt tokens are included, document and set
`retry_tokens_included` anomaly flag.

**`SRP-ADAPT-009`** Streaming: aggregate all chunks into a single `output`
count for the observation window.

**`SRP-ADAPT-010`** Batching: sum all token counts into the envelope's
primitives. A `batch_count` extension field MAY be included.

**`SRP-ADAPT-011`** Tool calls: document whether sub-request tokens are
included. Default policy: include all tokens attributed to the operator's
session.

**`SRP-ADAPT-012`** Multi-model workflows: emit one envelope per model
(preferred), or one envelope with `source.model = "multi"` and documented
aggregation.

---

## 4. Custom adapters

**`SRP-ADAPT-006`** An implementation MAY define custom adapters for providers
not in the initial set. Custom adapters MUST:
- Follow the same mapping rules (SRP-ADAPT-001 through SRP-ADAPT-005)
- Be registered in `adapters/registry.json` with a unique `adapter_id`
- Include at least 3 test vectors (normal, missing-cache, double-counting if
  applicable)
- Be documented in a per-provider `.md` file

---

## 5. Adapter registry

Adapters are registered in `adapters/registry.json`. Each entry MUST include:
- `adapter_id` — unique identifier (e.g., `anthropic-v1`)
- `provider` — provider name
- `supported_api_versions` — API versions the adapter supports
- `definition_file` — path to the per-provider `.md` documentation
- `field_mappings` — native field → OTEP primitive mapping
- `double_counting_policy` — how double-counting is handled
- `cache_creation_exposed` — boolean
- `cache_read_exposed` — boolean
- `test_vectors` — at least 3 test vector references

See `adapters/registry.json` for the machine-readable registry and the
per-provider files (`anthropic.md`, `openai.md`, `google.md`) for full
documentation.

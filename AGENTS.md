# AGENTS.md — tteop-spec

TTEOP (Token Telemetry Evaluation Operator Protocol) specification.
The SOLE interoperability protocol authority for AI operator token measurement.

GitHub repo name is `otep-spec` (historical, kept for URL stability).
npm package is `tteop-spec`. Protocol name is TTEOP.

## Context7 MCP — REQUIRED before writing library code

This repo writes code against external libraries. Before using a library API
that may have changed since training data cutoff, query Context7 to verify
the current pattern:

1. resolve-library-id — find the library (e.g. "Pydantic", "Python")
2. query-docs — ask the specific question (e.g. "Pydantic model validation")

Key libraries in this stack:
- Pydantic: /pydantic/pydantic
- Pydantic Settings: /pydantic/pydantic-settings
- Python: /python/cpython

Do not rely on training data for library APIs. Do not call more than 3 times
per question.

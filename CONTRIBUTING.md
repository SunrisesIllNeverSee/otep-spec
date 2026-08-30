# Contributing to OTEP

**Document status:** Informative

Thank you for your interest in contributing to the OTEP specification! This document explains how to contribute.

---

## Ways to Contribute

| Contribution type | How |
|-------------------|-----|
| Report a bug or ambiguity | Open a GitHub Issue |
| Propose a specification change | Submit an OEP (see `oeps/OEP-0000.md`) |
| Add a provider adapter | Create a file in `adapters/` and submit a PR |
| Add a test vector | Create a file in `test-vectors/` and submit a PR |
| Improve documentation | Submit a PR with your changes |
| Implement the protocol | See `IMPLEMENTATION-EXPERIENCE.md` |

---

## Contribution Model

OTEP adopts the **Developer Certificate of Origin (DCO)** prospectively from the remediation merge date (2026-08-30). All commits made on or after that date MUST include `Signed-off-by: Name <email>`.

The DCO certifies that the contributor wrote or has the right to submit the code. It does NOT assign copyright. See https://developercertificate.org/ for the full text.

To sign off, use `git commit -s` or add `Signed-off-by: Your Name <your.email@example.com>` to your commit message.

**Bootstrap commits:** The initial commits that established the repository (prior to the DCO adoption date) are documented as bootstrap contributions by the project founder. They are not retroactively signed off, and published `main` history is not rewritten. See `DISCLOSURES.md` for the bootstrap contribution record.

**[PROSPECTIVE]** — The DCO is adopted prospectively. The CLA-vs-DCO question (UD-7) remains open for revisit at foundation transfer (UD-6). See `UNRESOLVED-DECISIONS.md` §7.

---

## Pull Request Process

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Ensure tests pass: `node conformance/otep-runner.mjs`
5. Sign off your commits (`git commit -s`)
6. Open a pull request
7. For normative changes, reference the OEP number

### Review windows

- **Normative changes:** minimum 14 days
- **Non-normative changes:** minimum 7 days
- **Security fixes:** expedited, minimum 72 hours (per `GOVERNANCE.md` SRP-GOV-035)

---

## Code Style

- JSON files: 2-space indentation, no trailing commas
- Markdown files: 80-char line width where practical
- JavaScript: ESM modules, no external dependencies in conformance runner
- Python: PEP 8, no external dependencies in conformance runner

---

## Conflict of Interest Disclosure

All maintainers and frequent contributors MUST disclose any commercial affiliation with AI tool providers, observability platforms, or companies that build products on OTEP. Disclosures are recorded in the governance repository.

---

## Questions?

- Open a GitHub Issue with the `question` label
- Contact the maintainers via GitHub

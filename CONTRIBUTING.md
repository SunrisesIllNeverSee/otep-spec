# Contributing to TTEOP

**Document status:** Informative

Thank you for your interest in contributing to the TTEOP specification! This document explains how to contribute.

---

## Ways to Contribute

| Contribution type | How |
|-------------------|-----|
| Report a bug or ambiguity | Open a GitHub Issue |
| Propose a specification change | Submit an TEP (see `teps/TEP-0000.md`) |
| Add a provider adapter | Create a file in `adapters/` and submit a PR |
| Add a test vector | Create a file in `test-vectors/` and submit a PR |
| Improve documentation | Submit a PR with your changes |
| Implement the protocol | See `IMPLEMENTATION-EXPERIENCE.md` |

---

## Contribution Model

TTEOP adopts the **Developer Certificate of Origin (DCO)** prospectively from the remediation merge date. The DCO effective timestamp is **2026-08-30 00:00 UTC**. All commits with an author date on or after that timestamp MUST include `Signed-off-by: Name <email>`.

The DCO certifies that the contributor wrote or has the right to submit the code. It does NOT assign copyright. See https://developercertificate.org/ for the full text.

To sign off, use `git commit -s` or add `Signed-off-by: Your Name <your.email@example.com>` to your commit message.

**Bootstrap exception:** The initial commits that established the repository (commit `6ebc457` through `dbfb774`, all dated 2026-08-30) are explicitly exempt from the DCO requirement. These commits were authored before the DCO policy was adopted and are documented as bootstrap contributions by the project founder in `DISCLOSURES.md`. Published `main` history is not rewritten; these commits are not retroactively signed off. The DCO check script (`scripts/check-dco.sh`) uses `--since="2026-08-30"` and excludes commits listed in the bootstrap exception table.

**[PROSPECTIVE]** — The DCO is adopted prospectively. The CLA-vs-DCO question (UD-7) remains open for revisit at foundation transfer (UD-6). See `UNRESOLVED-DECISIONS.md` §7.

---

## Pull Request Process

1. Fork the repository
2. Create a branch from `main`
3. Make your changes
4. Ensure tests pass: `node conformance/tteop-runner.mjs`
5. Sign off your commits (`git commit -s`)
6. Open a pull request
7. For normative changes, reference the TEP number

### Review windows

- **Normative changes:** minimum 14 days
- **Non-normative changes:** minimum 7 days
- **Security fixes:** expedited, minimum 72 hours (per `GOVERNANCE.md` SRP-GOV-035)

### When may the project be reopened?

The project is operationally closed between releases. It may only be reopened when a valid trigger exists (correctness defect, security/privacy vulnerability, interoperability failure, provider telemetry change, normative ambiguity, deliberate new version, or external implementation proposal). See `MAINTENANCE-CHARTER.md` for the full reopening ruleset (SRP-GOV-057 through SRP-GOV-076). Polish, stylistic suggestions, and unfinished roadmap items are not valid reopening triggers.

---

## Code Style

- JSON files: 2-space indentation, no trailing commas
- Markdown files: 80-char line width where practical
- JavaScript: ESM modules, no external dependencies in conformance runner
- Python: PEP 8, no external dependencies in conformance runner

---

## Conflict of Interest Disclosure

All maintainers and frequent contributors MUST disclose any commercial affiliation with AI tool providers, observability platforms, or companies that build products on TTEOP. Disclosures are recorded in the governance repository.

---

## Questions?

- Open a GitHub Issue with the `question` label
- Contact the maintainers via GitHub

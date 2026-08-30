#!/usr/bin/env bash
#
# scripts/check-dco.sh — Verify that commits include DCO sign-off trailers.
#
# Event-aware:
#   - Pull request: check commits between the PR base and HEAD.
#   - Push to main: check the range of commits pushed (before..after).
#   - Local: check commits since the DCO adoption date.
#
# The DCO was adopted on 2026-08-30. Only commits made on or after that
# date are checked. Bootstrap commits (prior to adoption) are documented in
# DISCLOSURES.md and are not retroactively signed off.
#
# Usage:
#   scripts/check-dco.sh              # auto-detect mode
#   scripts/check-dco.sh <base> <head> # explicit range
#
# Exit codes:
#   0 — all new commits have Signed-off-by trailers (or no commits to check)
#   1 — one or more commits are missing sign-off
#
set -euo pipefail

# DCO adoption date (YYYY-MM-DD). Commits on or after this date must be signed off.
DCO_ADOPTION_DATE="2026-08-30"

# Bootstrap commits explicitly exempt from DCO (see DISCLOSURES.md).
# These predate the DCO policy adoption on the same calendar date.
BOOTSTRAP_COMMITS="6ebc457 dbfb774"

# Determine the commit range to check.
# Priority:
#   1. Explicit args: $1..$2
#   2. GitHub push event: GITHUB_BEFORE..GITHUB_AFTER
#   3. GitHub PR event: GITHUB_BASE..HEAD
#   4. Local: merge-base of origin/main..HEAD
#   5. Fallback: all commits since adoption date
COMMITS=""

if [ $# -ge 2 ]; then
    # Explicit range
    COMMITS=$(git rev-list "$1..$2" 2>/dev/null || true)
elif [ -n "${GITHUB_EVENT_NAME:-}" ]; then
    case "$GITHUB_EVENT_NAME" in
        pull_request)
            BASE="${GITHUB_BASE_REF:-main}"
            # Fetch the base ref so merge-base works
            git fetch origin "$BASE" >/dev/null 2>&1 || true
            MERGE_BASE=$(git merge-base "origin/$BASE" HEAD 2>/dev/null || true)
            if [ -n "$MERGE_BASE" ]; then
                COMMITS=$(git rev-list "$MERGE_BASE..HEAD" 2>/dev/null || true)
            fi
            ;;
        push)
            BEFORE="${GITHUB_BEFORE:-}"
            AFTER="${GITHUB_AFTER:-HEAD}"
            if [ -n "$BEFORE" ] && [ "$BEFORE" != "0000000000000000000000000000000000000000" ]; then
                COMMITS=$(git rev-list "$BEFORE..$AFTER" 2>/dev/null || true)
            else
                # New branch — check all commits since adoption date
                COMMITS=$(git rev-list --since="$DCO_ADOPTION_DATE" "$AFTER" 2>/dev/null || true)
            fi
            ;;
    esac
fi

# Fallback: local development
if [ -z "$COMMITS" ]; then
    MERGE_BASE=""
    if git rev-parse --verify origin/main >/dev/null 2>&1; then
        MERGE_BASE=$(git merge-base origin/main HEAD 2>/dev/null || true)
    elif git rev-parse --verify main >/dev/null 2>&1; then
        MERGE_BASE=$(git merge-base main HEAD 2>/dev/null || true)
    fi
    if [ -n "$MERGE_BASE" ]; then
        COMMITS=$(git rev-list "$MERGE_BASE..HEAD" 2>/dev/null || true)
    else
        COMMITS=$(git rev-list --since="$DCO_ADOPTION_DATE" HEAD 2>/dev/null || true)
    fi
fi

# Handle the case where there are no new commits to check.
if [ -z "$COMMITS" ]; then
    echo "DCO check: no new commits to verify (since $DCO_ADOPTION_DATE)."
    exit 0
fi

MISSING=0
FAILED_COMMITS=""

for commit in $COMMITS; do
    # Skip bootstrap commits that are explicitly exempt (see DISCLOSURES.md).
    SHORT=$(git rev-parse --short "$commit" 2>/dev/null || echo "")
    if echo "$BOOTSTRAP_COMMITS" | grep -qw "$SHORT"; then
        continue
    fi
    # Check if the commit message contains a Signed-off-by trailer.
    if ! git log -1 --format='%B' "$commit" | grep -qiE '^Signed-off-by: .+ <.+@.+>'; then
        MISSING=$((MISSING + 1))
        SHORT_SHA=$(git rev-parse --short "$commit")
        SUBJECT=$(git log -1 --format='%s' "$commit")
        FAILED_COMMITS="$FAILED_COMMITS  $SHORT_SHA — $SUBJECT\n"
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo "DCO check: $MISSING commit(s) missing Signed-off-by trailer:"
    echo -e "$FAILED_COMMITS"
    echo "Use 'git commit -s' or add 'Signed-off-by: Name <email>' to your commit message."
    exit 1
fi

TOTAL=$(echo "$COMMITS" | wc -l | tr -d ' ')
echo "DCO check: all $TOTAL commit(s) have Signed-off-by trailers."
exit 0

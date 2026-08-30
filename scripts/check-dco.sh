#!/usr/bin/env bash
#
# scripts/check-dco.sh — Verify that commits on the current branch include
# Developer Certificate of Origin (DCO) sign-off trailers.
#
# The DCO was adopted on 2026-08-30. Only commits made on or after that
# date are checked. Bootstrap commits (prior to adoption) are documented in
# DISCLOSURES.md and are not retroactively signed off.
#
# Usage:
#   scripts/check-dco.sh
#
# Exit codes:
#   0 — all new commits have Signed-off-by trailers (or no commits to check)
#   1 — one or more commits are missing sign-off
#
set -euo pipefail

# DCO adoption date (YYYY-MM-DD). Commits on or after this date must be signed off.
DCO_ADOPTION_DATE="2026-08-30"

# Determine the merge-base with main so we only check new commits on this branch.
# Fall back to checking against the adoption date if main is not available.
MERGE_BASE=""
if git rev-parse --verify origin/main >/dev/null 2>&1; then
    MERGE_BASE=$(git merge-base origin/main HEAD 2>/dev/null || true)
elif git rev-parse --verify main >/dev/null 2>&1; then
    MERGE_BASE=$(git merge-base main HEAD 2>/dev/null || true)
fi

# Build the list of commits to check.
# If we have a merge-base, check commits since that point.
# Otherwise, check all commits since the DCO adoption date.
if [ -n "$MERGE_BASE" ]; then
    COMMITS=$(git rev-list "$MERGE_BASE..HEAD" 2>/dev/null || true)
else
    # No merge-base available; check commits since the adoption date.
    COMMITS=$(git rev-list --since="$DCO_ADOPTION_DATE" HEAD 2>/dev/null || true)
fi

# Handle the case where there are no new commits to check.
if [ -z "$COMMITS" ]; then
    echo "DCO check: no new commits to verify (since $DCO_ADOPTION_DATE)."
    exit 0
fi

MISSING=0
FAILED_COMMITS=""

for commit in $COMMITS; do
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

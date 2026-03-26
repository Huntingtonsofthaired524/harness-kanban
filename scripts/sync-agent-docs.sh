#!/usr/bin/env sh
set -eu

CLAUDE_FILE="CLAUDE.md"
AGENTS_FILE="AGENTS.md"

# Skip when docs are not present (e.g. partial checkouts).
[ -f "$CLAUDE_FILE" ] || exit 0
[ -f "$AGENTS_FILE" ] || exit 0

# Avoid overwriting local edits that are not staged yet.
if ! git diff --quiet -- "$CLAUDE_FILE" "$AGENTS_FILE"; then
  echo "pre-commit: CLAUDE.md or AGENTS.md has unstaged changes."
  echo "pre-commit: stage or stash those changes, then commit again."
  exit 1
fi

CLAUDE_STAGED=0
AGENTS_STAGED=0

if git diff --cached --name-only --diff-filter=ACMR -- "$CLAUDE_FILE" | grep -qx "$CLAUDE_FILE"; then
  CLAUDE_STAGED=1
fi

if git diff --cached --name-only --diff-filter=ACMR -- "$AGENTS_FILE" | grep -qx "$AGENTS_FILE"; then
  AGENTS_STAGED=1
fi

if [ "$CLAUDE_STAGED" -eq 0 ] && [ "$AGENTS_STAGED" -eq 0 ]; then
  exit 0
fi

if [ "$CLAUDE_STAGED" -eq 1 ] && [ "$AGENTS_STAGED" -eq 1 ]; then
  if ! git diff --cached --quiet -- "$CLAUDE_FILE" "$AGENTS_FILE"; then
    echo "pre-commit: CLAUDE.md and AGENTS.md are both staged with different content."
    echo "pre-commit: keep one source of truth, copy it to the other file, and re-stage."
    exit 1
  fi

  exit 0
fi

if [ "$CLAUDE_STAGED" -eq 1 ]; then
  cp "$CLAUDE_FILE" "$AGENTS_FILE"
  git add "$AGENTS_FILE"
  echo "pre-commit: synced CLAUDE.md -> AGENTS.md"
  exit 0
fi

cp "$AGENTS_FILE" "$CLAUDE_FILE"
git add "$CLAUDE_FILE"
echo "pre-commit: synced AGENTS.md -> CLAUDE.md"

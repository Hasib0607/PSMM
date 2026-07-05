#!/usr/bin/env bash
# Remove macOS metadata files (AppleDouble ._* and .DS_Store) from disk and git index.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PRUNE=(
  -path ./.git -o
  -path ./node_modules -o
  -path ./.next -o
  -path ./out
)

echo "==> Scanning for macOS artifacts under $ROOT (excluding node_modules, .next, .git)"

while IFS= read -r -d '' file; do
  rm -f "$file"
  echo "  deleted: $file"
done < <(find . \( "${PRUNE[@]}" \) -prune -o -name '.DS_Store' -print0 2>/dev/null)

while IFS= read -r -d '' file; do
  rm -f "$file"
  echo "  deleted: $file"
done < <(find . \( "${PRUNE[@]}" \) -prune -o -name '._*' -print0 2>/dev/null)

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files -- '.DS_Store' '*/.DS_Store' '._*' '*/._*' | grep -q .; then
    echo "==> Removing tracked macOS artifacts from git index"
    git ls-files -z -- '.DS_Store' '*/.DS_Store' '._*' '*/._*' \
      | xargs -0 git rm -r --cached --ignore-unmatch --
  else
    echo "==> No tracked macOS artifacts in git index"
  fi
fi

echo "==> Done. Patterns in .gitignore will prevent re-adding."

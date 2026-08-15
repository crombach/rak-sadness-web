#!/usr/bin/env bash
# Host one or more images or recordings on the repo's pr-assets branch and
# print the raw URL each one is reachable at for a PR body.
#
# Usage: upload_pr_media.sh --feature <name> <file> [<file> ...]
#
# --feature names the directory on pr-assets the files land under. Reuses
# the directory if a prior run already made one for this feature.
#
# gh has no API to attach a file to a PR body: only the web UI's
# drag-and-drop upload gets a user-attachments URL. pr-assets is this repo's
# standing workaround, a branch that holds nothing but images and
# recordings, one directory per feature. This script is the only thing that
# should ever write to it.

set -euo pipefail

die() {
  echo "$@" >&2
  exit 1
}

FEATURE=""
FILES=()

while [ $# -gt 0 ]; do
  case "$1" in
    --feature)
      [ -n "${2:-}" ] || die "--feature needs a value"
      FEATURE="$2"
      shift 2
      ;;
    -h | --help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

[ -n "$FEATURE" ] || die "--feature is required"
[[ "$FEATURE" =~ ^[a-zA-Z0-9._-]+$ ]] || die "--feature must be a plain directory name, got: $FEATURE"
[ "${#FILES[@]}" -gt 0 ] || die "no files given"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || die "no such file: $f"
done

command -v git >/dev/null || die "git not on PATH"

ROOT="$(git rev-parse --show-toplevel)"
REMOTE_URL="$(git -C "$ROOT" remote get-url origin)"
# Owner/repo is the last two path segments regardless of scp-style
# (git@host:owner/repo.git) or https (https://host/owner/repo.git) form.
SLUG="$(echo "$REMOTE_URL" | sed -E 's#^.*[:/]([^/]+/[^/]+)$#\1#; s#\.git$##')"

echo "Fetching pr-assets..." >&2
git -C "$ROOT" fetch origin pr-assets

WT="$(mktemp -d)"
cleanup() {
  git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || true
  rm -rf "$WT"
}
trap cleanup EXIT

# -B resets the local pr-assets branch to origin/pr-assets before checkout,
# so this always starts from what is actually on the remote.
git -C "$ROOT" worktree add -B pr-assets "$WT" origin/pr-assets >/dev/null

mkdir -p "$WT/$FEATURE"
for f in "${FILES[@]}"; do
  cp "$f" "$WT/$FEATURE/$(basename "$f")"
done

git -C "$WT" add "$FEATURE"
if git -C "$WT" diff --cached --quiet; then
  echo "Nothing changed, $FEATURE/ already holds these files." >&2
else
  git -C "$WT" commit -q -m "chore: add $FEATURE PR screenshots"
  git -C "$WT" push -q origin pr-assets
fi

echo "RESULT: OK"
for f in "${FILES[@]}"; do
  echo "https://raw.githubusercontent.com/$SLUG/pr-assets/$FEATURE/$(basename "$f")"
done

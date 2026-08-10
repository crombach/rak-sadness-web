#!/usr/bin/env python3
"""PostToolUse hook: nudge Claude to keep the CLAUDE.md search tree current.

Pairs with the agentify-docs skill. Fires after Edit/Write/MultiEdit. When an
edit *structurally* changes a directory (a new file appears, i.e. something the
directory's CLAUDE.md index or its parent's child links should reflect), it
injects a short reminder naming the affected CLAUDE.md so Claude can update it.

Deliberately does NOT nudge on in-place edits to existing files: rewriting a
function body rarely changes a one-line directory summary. The hook only detects;
Claude judges whether the summary actually needs to change and rewrites it.

Self-gating: silent when the file is not in a git repo, when no ancestor
directory has a CLAUDE.md (tree never built), or when the edit is a plain modify.
Any unexpected error exits 0 silently so the hook never blocks a tool call.
"""

import json
import os
import subprocess
import sys

STRUCTURAL_TOOLS = {"Edit", "Write", "MultiEdit"}
CLAUDE_MD = "CLAUDE.md"
# Named once: every reminder is tagged by emit(), so a skill rename touches one line.
SKILL_TAG = "(agentify-docs skill)"


def git(root, *args):
    return subprocess.run(
        ["git", "-C", root, *args],
        capture_output=True, text=True, check=True,
    ).stdout


def emit(context):
    """Print PostToolUse additionalContext, skill-tagged, and exit."""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "%s %s" % (context, SKILL_TAG),
        }
    }))
    sys.exit(0)


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        return
    payload = json.loads(raw)

    if payload.get("tool_name") not in STRUCTURAL_TOOLS:
        return

    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path")
    if not file_path:
        return

    cwd = payload.get("cwd") or os.getcwd()
    if not os.path.isabs(file_path):
        file_path = os.path.join(cwd, file_path)
    # realpath so it shares a symlink-resolved prefix with git's toplevel
    # (e.g. macOS /var -> /private/var), keeping relative paths clean.
    file_path = os.path.realpath(file_path)

    # Never nudge about edits to a CLAUDE.md itself (avoids feedback loops).
    if os.path.basename(file_path) == CLAUDE_MD:
        return

    file_dir = os.path.dirname(file_path)
    try:
        root = os.path.realpath(git(file_dir, "rev-parse", "--show-toplevel").strip())
    except (subprocess.CalledProcessError, FileNotFoundError):
        return  # not a git repo

    # lint_claude_md.py never indexes a dot-directory, so nothing under one can need a
    # CLAUDE.md. `.claude/skills/` in particular is written by the build, contrib,
    # and boundaries phases, which would otherwise nudge on every run. Judged
    # relative to the repo root, so a checkout that itself lives under a
    # dot-directory (~/.local/src/repo) still gets nudges.
    if any(part.startswith(".")
           for part in os.path.relpath(file_dir, root).split(os.sep)):
        return

    # Structural check: only nudge when the file is newly added/untracked.
    # Plain modifications (" M" / "M ") and staged edits ("MM") are skipped.
    status = git(root, "status", "--porcelain", "--", file_path)
    code = status[:2] if status else ""
    is_new = code in ("??", "A ", "AM")
    if not is_new:
        return

    # Walk up from the file's directory to the repo root for the nearest CLAUDE.md.
    # file_dir and root are both absolute and symlink-resolved, so compare directly.
    nearest = None
    d = file_dir
    while True:
        candidate = os.path.join(d, CLAUDE_MD)
        if os.path.isfile(candidate):
            nearest = candidate
            break
        if d == root:
            break
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent

    if nearest is None:
        return  # no CLAUDE.md tree here; skill hasn't been run

    # A hit on the first step up means the file's own directory is already indexed.
    own_dir_covered = os.path.dirname(nearest) == file_dir

    rel_file = os.path.relpath(file_path, root)
    rel_md = os.path.relpath(nearest, root)

    if own_dir_covered:
        emit(
            f"New file `{rel_file}` was added. Its directory has a CLAUDE.md "
            f"(`{rel_md}`) that is part of the repo search tree. If this file "
            f"changes what that directory contains, update the summary in "
            f"`{rel_md}`. Only edit the index if the description is now "
            f"inaccurate."
        )

    rel_dir = os.path.relpath(file_dir, root)
    emit(
        f"New file `{rel_file}` was added in `{rel_dir}/`, which has no CLAUDE.md "
        f"but sits under the search tree indexed by `{rel_md}`. If `{rel_dir}/` is "
        f"now a meaningful directory, consider adding a CLAUDE.md there and linking "
        f"it from `{rel_md}`."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never let a hook error block the tool call.
        sys.exit(0)

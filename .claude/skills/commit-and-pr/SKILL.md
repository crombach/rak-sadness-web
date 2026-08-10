---
name: commit-and-pr
description: This repo's commit and PR conventions. Read before writing any git commit message, `gh pr create`/`gh pr edit` title, or PR body here. Header format, ticket key placement, scope vocabulary, PR template.
---

# Commits and pull requests

- Commit subject + PR title, one format: `<type>(<scope>)?!?: [<issue>]? <imperative summary>`. Conventional Commits types. `!` = breaking.
- Scope = module. `[<issue>]` = main ticket ID: `feat(auth): [YCOM-21] add device-code login`.
- PR body: build from `.github/pull_request_template.md`, write over its comments. `--body`/`--body-file` skip prefill.
- Commit body: only a why subject can't carry.
- Enforced by `.claude/hooks/check_conventions.py`, `.github/workflows/pr-title.yml`.
- No bypass. Rewrite text, don't work around hook.

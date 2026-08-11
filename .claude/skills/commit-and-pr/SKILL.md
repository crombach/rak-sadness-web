---
name: commit-and-pr
description: This repo's commit and PR conventions. Read before writing any git commit message, `gh pr create`/`gh pr edit` title, or PR body here. Header format, ticket key placement, scope vocabulary, PR template.
---

# Commits and pull requests

- Commit subject + PR title, one format: `<type>(<scope>)?!?: [<issue>]? <imperative summary>`. Conventional Commits types. `!` = breaking.
- Scope = module. `[<issue>]` = main ticket ID: `feat(auth): [YCOM-21] add device-code login`.
- PR body: build from `.github/pull_request_template.md`, write over its comments. `--body`/`--body-file` skip prefill.
- PR body links every ticket work belongs to, title's key first. Hook only sees branch's key, rest is on you. No ticket: link nothing, never invent key.
- PR body length: under 200 words, bullets one line each. Only what a reviewer needs to review the diff. No ticket retelling, no history, no counts or benchmark numbers, no per-file walkthrough, no self-assessment. Embedded screenshots and recordings don't count against the budget.
- Commit body: only a why subject can't carry.
- Enforced by `.claude/hooks/check_conventions.py`, `.github/workflows/pr-title.yml`.
- No bypass. Rewrite text, don't work around hook.

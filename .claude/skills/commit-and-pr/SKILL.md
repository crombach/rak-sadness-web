---
name: commit-and-pr
description: This repo's commit and PR conventions. Read before writing any git commit message, `gh pr create`/`gh pr edit` title, or PR body here. Header format, ticket key placement, scope vocabulary, PR template.
---

# Commits and pull requests

- Commit subject + PR title, one format: `<type>(<scope>)?!?: [<issue>]? <imperative summary>`. Conventional Commits types. `!` = breaking.
- Scope = module. `[<issue>]` = main ticket ID: `feat(auth): [YCOM-21] add device-code login`.
- PR body: build from `.github/pull_request_template.md`, write over its comments. `--body`/`--body-file` skip prefill.
- PR body links every ticket work belongs to, title's key first. Hook only sees branch's key, rest is on you. No ticket: link nothing, never invent key.
- PR body length: under 256 words, bullets one line each. Only what a reviewer needs to review the diff. No ticket retelling, no history, no counts or benchmark numbers, no per-file walkthrough, no self-assessment. Headings, an attribution footer, embedded screenshots and recordings don't count against the budget.
- Commit body: only a why subject can't carry.
- Prose in a subject, commit body, or PR body: ASD-STE100 Simplified Technical English, and Zinsser's simplicity, brevity, clarity, humanity. Active voice, imperative, simple tenses. One idea per sentence, no sentence over 20 words. No `-ing` form as a noun. Condition before action. Same word for the same thing. Short common word over long one. Max three nouns in a row. Keep articles. No slang, idiom, metaphor, em-dash, semicolon, or aside.
- The hook denies three of the rules above in a subject, a `-m` body, and a PR body: a sentence over 20 words, a long word with a short swap (`utilize`, `leverage`, `prior to`, and the rest), and an `-ing` form used as a noun. It also denies a PR body over the template's word budget. The rest is yours to judge.
- Enforced by `.claude/hooks/check_conventions.py`, `.github/workflows/pr-title.yml`.
- No bypass. Rewrite text, don't work around hook.

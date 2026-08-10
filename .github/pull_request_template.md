<!--
This title and every commit subject share the Conventional Commits 1.0.0 format:
https://www.conventionalcommits.org/en/v1.0.0/

  <type>(<scope>)?!?: [<issue>]? <imperative summary>

  types    build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
  (scope)  the module changed, in parentheses. Optional
  !        optional, marks a breaking change
  [issue]  the main ticket ID in brackets. Omit when there is no ticket
  :        required, followed by one space

  feat(auth): [YCOM-21] add device-code login
  refactor(api)!: drop v1 response envelope

Shortest body a reviewer can review from. Bullets, not paragraphs. Every line must
change how they read the diff. No restating the diff, no process narration.
No em-dashes, no semicolons. Short sentences instead, one idea each. Plain words
a reader takes in once. Delete sections that don't apply. Leave no empty headings.
-->

## What

<!-- What changed and where. Link every ticket this belongs to (Jira, Linear), the one in the title first. -->

## Why

<!-- The problem. Skip if What covers it. -->

## Changes

<!--
One bullet per substantive change: the design decisions a reviewer would otherwise reverse-engineer, and what is
deliberately out of scope. Skip the mechanical ones.
-->

## Verification

<!-- Only checks CI can't show: a manual repro, a one-off check. Never the standard build, test, lint, or hooks. Else delete. -->

## Notes / Follow-ups

<!-- Only what a reviewer or merger would be wrong not to know: a gap this PR doesn't fix, merge ordering, a dependent PR. Else delete. -->

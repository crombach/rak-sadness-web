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

Shortest body a reviewer can review from, under 256 words. Bullets, one line each,
not paragraphs. Every line must change how they read the diff. Cut every line that
does not, and delete every section left with nothing to say. A heading, an
attribution footer and an embedded screenshot or recording do not count against
the budget. Add one where seeing the change beats reading about it,
usually a UX change, not as a matter of course.

Never in the body: a retelling of the ticket, the path taken to the change,
alternatives rejected, counts of files or lines or tests, timings, coverage or
benchmark numbers nobody asked for, a tour of the code, or a note about your own
machine. A reviewer reads the diff and can click the ticket.

Write ASD-STE100 Simplified Technical English, for Zinsser's simplicity, brevity,
clarity and humanity. Active voice. Simple tenses. One idea per sentence, and no
sentence over 20 words. No -ing form as a noun: "before you run it", not "before
running it". Condition before action. The same word for the same thing every time.
The short common word, not the long one. Three nouns in a row at most. Keep the
articles. No slang, no idiom, no metaphor. No em-dashes, no semicolons. Leave no
empty headings.
-->

## What

<!-- One or two sentences: what changed and where. Link every ticket this belongs to (Jira, Linear) as a URL, the one in the title first. No ticket: link nothing. -->

## Why

<!-- The problem, one or two sentences. Skip if What covers it. -->

## Changes

<!--
One bullet per design decision a reviewer would otherwise reverse-engineer, plus anything deliberately out of scope.
One line each, six at most. Skip the mechanical ones.
-->

## Verification

<!-- Only checks CI can't show: a manual repro, a one-off check. One line each. Never the standard build, test, lint, or hooks. Else delete. -->

## Notes / Follow-ups

<!-- Only what a reviewer or merger would be wrong not to know: a gap this PR doesn't fix, merge ordering, a dependent PR. One line each. Else delete. -->

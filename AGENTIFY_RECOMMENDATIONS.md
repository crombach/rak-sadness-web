# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### The bundle is one 1.26 MB chunk

Vite warns about it on every build.

**Suggested action:** ignore, or set `build.chunkSizeWarningLimit` to silence it.
Code-splitting a single-page tool with one route buys nothing.

## Code

### Two chokepoint files serialize most parallel work

`src/components/RakSadness.tsx` and `src/utils/getPlayerScores.ts` (~590 lines of
scoring). Almost any two feature branches touch one of them. Documented in
`.claude/skills/parallel-work/SKILL.md`.

**Suggested action:** advisory only. Extracting the upload/fetch flow out of
`RakSadness.tsx` into a hook, and splitting `getPlayerScores.ts` by concern, would
let more work run in parallel. Not worth doing for its own sake.

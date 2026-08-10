# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### The bundle is one 1.26 MB chunk

Vite warns about it on every build. Pre-existing: Create React App produced the
same single-chunk output.

**Suggested action:** ignore, or set `build.chunkSizeWarningLimit` to silence it.
Code-splitting a single-page tool with one route buys nothing.

## Code

### `@mui/icons-material` 9 sits beside `@mui/joy` 5

Icons are on 9, which pulled in `@mui/material` 9. Joy 5 is a beta line in
maintenance and keeps its own nested `@mui/system` 5. Typecheck, all 151 tests,
and the production build pass, and the icon suites assert on rendered icons.

**Suggested action:** eyeball the deployed page once. Two MUI style engines in one
bundle is the kind of thing tests cannot see. Joy's successor is Base UI, so a
move off Joy is the real fix whenever the UI is next touched.

### Two chokepoint files serialize most parallel work

`src/components/RakSadness.tsx` and `src/utils/getPlayerScores.ts` (~590 lines of
scoring). Almost any two feature branches touch one of them. Documented in
`.claude/skills/parallel-work/SKILL.md`.

**Suggested action:** advisory only. Extracting the upload/fetch flow out of
`RakSadness.tsx` into a hook, and splitting `getPlayerScores.ts` by concern, would
let more work run in parallel. Not worth doing for its own sake.

# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### `pages:deploy` has not been run against `wrangler.toml`

`wrangler.toml` declares `name = "rak-sadness"`, `compatibility_date`, and the
`RAK_SADNESS_BUCKET` binding on the `rak-sadness` bucket. Local dev is verified on
wrangler 4: wrangler reports the binding, the Pages Function runs, `/` serves 200.
The `Cloudflare Pages` check also passed on the PR that added the file.

What is still untested is `npm run pages:deploy` from a laptop. It is auth-gated
and production-affecting, and `wrangler *` sits in `ask`, so it was not run.

The file omits `pages_build_output_dir` on purpose. Without it, wrangler treats the
file as local-development-only; with it, the file becomes the source of truth for
production builds and overrides the dashboard settings this project actually uses.

**Suggested action:** only add that key as part of deliberately moving build
config out of the dashboard and into the repo.

To make `/api/picks/:week` return a real spreadsheet locally:
`wrangler r2 object put rak-sadness/picks/1.xlsx --file <path> --local`.

### The bundle is one 1.26 MB chunk

Vite warns about it on every build. Pre-existing: Create React App produced the
same single-chunk output.

**Suggested action:** ignore, or set `build.chunkSizeWarningLimit` to silence it.
Code-splitting a single-page tool with one route buys nothing.

## Code

### `@mui/icons-material` 9 sits beside `@mui/joy` 5

Icons are on 9, which pulled in `@mui/material` 9. Joy 5 is a beta line in
maintenance and keeps its own nested `@mui/system` 5. Typecheck, all 147 tests,
and the production build pass, and the icon suites assert on rendered icons.

**Suggested action:** eyeball the deployed page once. Two MUI style engines in one
bundle is the kind of thing tests cannot see. Joy's successor is Base UI, so a
move off Joy is the real fix whenever the UI is next touched.

### Test coverage gaps

147 tests cover the scoring logic, the workbook export, both ESPN fetchers, the
toast queue, and every component. Still untested:

- `LogoButton` and `FloatingLabelInput`, the only two components with no suite.
  `PlayerName` has no file of its own but is asserted through both table suites.
- `getPickResults` explanation text for postponed or canceled games.

**Suggested action:** low value. The scoring and parsing paths, where the real
complexity lives, are covered.

### Two chokepoint files serialize most parallel work

`src/components/RakSadness.tsx` and `src/utils/getPlayerScores.ts` (~590 lines of
scoring). Almost any two feature branches touch one of them. Documented in
`.claude/skills/parallel-work/SKILL.md`.

**Suggested action:** advisory only. Extracting the upload/fetch flow out of
`RakSadness.tsx` into a hook, and splitting `getPlayerScores.ts` by concern, would
let more work run in parallel. Not worth doing for its own sake.

### Dead code left in place

Not removed, because it predates this work:

- `RakSadness.tsx` opens the `navbarLeft` memo with a JSX expression statement
  that is built and discarded before the real `return`.
- `web-vitals` is a dependency but nothing imports it. Create React App generated
  a `reportWebVitals` module that this repo no longer has.

**Suggested action:** delete both when next editing those files.

## Config

### Deliberately left prompting

- `npm run pages:deploy`, `wrangler *`, `npx wrangler *` are in `ask`. They deploy
  to production or mutate Cloudflare state, so they should never fire unattended.
- `git push --force` / `-f` are in `deny`, even though everyday `git` and `gh` are
  allowed.

### Activation prerequisites

- Project `allow` rules and the three checked-in hooks only take effect after you
  accept the workspace trust dialog for this repo.
- An org policy of `allowManagedHooksOnly` would disable the project hooks
  entirely.
- `.mcp.json` servers need per-user approval on first run.

## MCP

`cloudflare-docs` and `playwright` are in `.mcp.json`. Neither needs an
environment variable. `playwright` downloads a browser on first use.

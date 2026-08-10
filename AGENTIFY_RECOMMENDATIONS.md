# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### Three dependencies are held back by peer conflicts

Everything else is on its latest version and `npm audit` reports 0
vulnerabilities, down from 34. These three cannot move yet:

- **eslint 10 / @eslint/js 10.** `eslint-plugin-jsx-a11y` 6.10.2 declares support
  through eslint 9 only, so npm fails the install with `ERESOLVE`. Unblocks when
  jsx-a11y ships an eslint 10 range, or if you drop the plugin.
- **typescript 7.** `typescript-eslint` 8.67 throws `typescript-eslint does not
support TS 7.0` on load. Tracked upstream in typescript-eslint#10940. There is
  a documented side-by-side setup that typechecks on 7 while linting through the
  TS 6 API, at the cost of a second compiler in the tree.
- **@types/node 26.** Pinned to 22 on purpose, to match the Node the app runs on.

**Suggested action:** recheck after typescript-eslint lands TS 7 support. Nothing
here is urgent.

### `pages:deploy` has not been run against `wrangler.toml`

`wrangler.toml` declares `name = "rak-sadness"`, `compatibility_date`, and the
`RAK_SADNESS_BUCKET` binding on the `rak-sadness` bucket. Local dev is verified on
wrangler 4: wrangler reports the binding, the Pages Function runs, `/` serves 200.
The `Cloudflare Pages` check also passed on the PR that added the file.

What is still untested is `npm run pages:deploy` from a laptop. It is auth-gated
and production-affecting, and `wrangler *` sits in `ask`, so it was not run.

The file omits `pages_build_output_dir` on purpose: that key makes `pages:dev`
fail with `Specify either a directory OR a proxy command, not both`, and hot
reload is worth more.

**Suggested action:** if a Cloudflare build ever does ask for that key, add
`pages_build_output_dir = "build"` and change `pages:dev` to
`npm run build && wrangler pages dev --port 3000`, giving up hot reload.

To make `/api/picks/:week` return a real spreadsheet locally:
`wrangler r2 object put rak-sadness/picks/1.xlsx --file <path> --local`.

### `pages:dev` still uses a deprecated wrangler form

Verified working on wrangler 4.120, but it warns that `pages dev -- <command>` is
deprecated and will be removed.

**Suggested action:** when it does break, either move to
`wrangler pages dev ./build` against a built directory (losing hot reload) or
migrate the project from Pages to Workers static assets, where the Vite plugin
gives you bindings in the dev server directly.

### Nothing gates the tests on a PR

`npm run build` runs `typecheck` first, so a type error fails the Cloudflare
build. Nothing runs `make check`, so a failing test or a lint error can merge.
Actions is enabled and already runs `pr-title.yml`.

**Suggested action:** add a workflow running `make setup && make check` on pull
requests. Roughly 20 lines, and it makes the 147 tests load-bearing.

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

## Contrib

### Existing history does not follow Conventional Commits

0 of the commits before this work conform. Published history is never rewritten
to fit a convention, so nothing to do. The convention and the
`conventional-commit-title` check apply going forward.

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

`cloudflare-docs` and `playwright` are in `.mcp.json`; the `yahoo-connectors`
gateway was removed at your request. Neither needs an environment variable.
`playwright` downloads a browser on first use.

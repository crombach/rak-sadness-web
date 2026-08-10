# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### `pages:deploy` ignores `wrangler.toml`

`npm run pages:deploy` is verified end to end against the real project. It uploads
a working deployment: `/` serves 200, the Pages Function runs, and
`/api/picks/1` returns the real spreadsheet out of R2, so direct-upload
deployments inherit the bucket binding from the dashboard.

The catch is that `wrangler.toml` plays no part in it. Because the file omits
`pages_build_output_dir`, wrangler skips it entirely and warns:

> We detected a configuration file at wrangler.toml but it is missing the
> "pages_build_output_dir" field, required by Pages. Ignoring configuration file
> for now.

So `name = "rak-sadness"` is never read, and the bare command fails with `Missing
Pages project name`. The script passes `--project-name` instead. That leaves
`wrangler.toml` doing exactly one job: configuring `wrangler pages dev` for local
development.

Adding `pages_build_output_dir` would make the file authoritative for production
builds and override the dashboard settings this project actually builds from.

**Suggested action:** only add that key as part of deliberately moving build
config out of the dashboard and into the repo.

Two notes on deploying by hand. The branch decides the environment: the project's
production branch is `main`, so a deploy from any other branch is a preview on its
own subdomain. And the project is git-connected, so pushing a branch already
produces a preview build; a manual deploy is only for testing the command itself.

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

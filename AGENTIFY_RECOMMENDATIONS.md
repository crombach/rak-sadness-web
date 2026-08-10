# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### The deploy path has not been exercised against `wrangler.toml`

`wrangler.toml` now declares `name = "rak-sadness"`, `compatibility_date`, and the `RAK_SADNESS_BUCKET` binding on the `rak-sadness` bucket. Local dev is verified: wrangler reports the binding, the Pages Function runs, `/` serves 200.

It deliberately omits `pages_build_output_dir`, because that key makes `pages:dev` fail with `Specify either a directory OR a proxy command, not both` and hot reload is worth more than the key. That choice is unverified against two things this environment cannot reach:

- `npm run pages:deploy` — auth-gated, production-affecting, and `wrangler *` sits in `ask`, so it was not run.
- The Cloudflare-side git build. The project has `Git Provider: Yes`, so pushes trigger a build on Cloudflare, which previously ran with no `wrangler.toml` at all.

**Suggested action:** watch the first deploy after this file lands. If the Cloudflare build complains about a missing `pages_build_output_dir`, add `pages_build_output_dir = "build"` and change `pages:dev` to `npm run build && wrangler pages dev --port 3000`, giving up hot reload.

To make `/api/picks/:week` return a real spreadsheet locally: `wrangler r2 object put rak-sadness/picks/1.xlsx --file <path> --local`.

### `pages:dev` uses a deprecated wrangler form

Verified working, but wrangler 3.114 warns that `pages dev -- <command>` is deprecated and will be removed. Wrangler 4 is out.

**Suggested action:** when you upgrade to wrangler 4, switch to `wrangler pages dev ./build` against a built directory. That loses hot reload, so it is a different workflow, not a drop-in swap.

### 34 npm vulnerabilities need a breaking upgrade

`npm audit fix` was run and fixed nothing. The remaining 34 (9 low, 7 moderate, 18 high) are all transitive through `react-scripts` 5, which is unmaintained. `npm audit fix --force` would replace it.

**Suggested action:** migrating off `react-scripts` to Vite is the real fix. That is a project, not a chore. It would also clear the deprecated-wrangler and Sass `legacy-js-api` warnings.

### Test coverage gaps

67 tests now cover the scoring logic, the toast queue, the explanation table, and the `RakSadness` flows. Still untested:

- The XLSX parsing and player-ranking half of `getPlayerScores` — needs a fixture workbook plus a stubbed `getLeagueResults`.
- `buildSpreadsheetBuffer` — needs assertions against a generated workbook.
- `getLeagueInfo` / `getLeagueResults` — need recorded ESPN responses.
- `ScoresTable`, `Navbar`, `Footer`, `Toaster` in isolation. `Toaster` and `ScoresTable` are exercised indirectly through the `RakSadness` suite.

**Suggested action:** worth doing if the knockout or tiebreaker rules change, or before a Vite migration, so the migration has a safety net.

## Boundaries

Documented in `.claude/skills/parallel-work/SKILL.md`. One advisory item remains.

### Two chokepoint files serialize most parallel work

`src/components/RakSadness.tsx` and `src/utils/getPlayerScores.ts` (~580 lines of scoring). Almost any two feature branches touch one of them.

**Suggested action:** advisory only. Extracting the upload/fetch flow out of `RakSadness.tsx` into a hook, and splitting `getPlayerScores.ts` by concern, would let more work run in parallel. Not worth doing for its own sake.

## Contrib

### Actions is not enabled for this repo

`.github/workflows/pr-title.yml` is checked in and kept at your request, but it will not run until GitHub Actions is enabled. Until then, PR titles are enforced for agents only, by `.claude/hooks/check_conventions.py`.

### Existing history does not follow Conventional Commits

0 of the last 100 commit subjects conform. Published history is never rewritten to fit a convention, so nothing to do — the convention starts with the next commit.

## Config

### Deliberately left prompting

- `npm run pages:deploy`, `wrangler *`, `npx wrangler *` are in `ask`. They deploy to production or mutate Cloudflare state, so they should never fire unattended.
- `git push --force` / `-f` are in `deny`, even though everyday `git` and `gh` are allowed.

### Activation prerequisites

- Project `allow` rules and the three checked-in hooks only take effect after you accept the workspace trust dialog for this repo.
- An org policy of `allowManagedHooksOnly` would disable the project hooks entirely.
- `.mcp.json` servers need per-user approval on first run; both currently show `⏸ Pending approval`.

## MCP

`cloudflare-docs` and `playwright` are in `.mcp.json`; the `yahoo-connectors` gateway was removed at your request. Neither needs an environment variable. `playwright` downloads a browser on first use.

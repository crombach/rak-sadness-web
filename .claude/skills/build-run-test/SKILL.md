---
name: build-run-test
description: How to build, run, and test this repo. Read before any npm, make, tsc, eslint, prettier, or wrangler command here, before adding a Makefile target, before touching CI. Make targets, node version, ports, Cloudflare prereqs, known gotchas.
---

# Build, run, test

`make help` lists targets. Run targets, not raw npm scripts.

## Toolchain

- Node `v20.8` (`.nvmrc`), npm 10 (`lockfileVersion: 3`). `nvm use` before anything. `make setup` fails with an actionable message on a major mismatch.
- Two CI signals on a PR, neither of which builds the app the way the Makefile does: `conventional-commit-title` (`.github/workflows/pr-title.yml`, Actions is enabled) and `Cloudflare Pages`, which builds from git using the dashboard's own settings. The Makefile is still the only place the local build story is written down.

## Verified

From a clean checkout: `make setup`, `make build`, `make run`, `make test`, `make check` all green. `make run` serves `http://localhost:3000`, HTTP 200, `<title>Rak Madness Scoreboard</title>`. `CI=true npm run build` also green — keep it that way, since CI treats warnings as errors and the codebase has warning-free build lint today.

## Tests

67 cases, 4 suites, all offline:

- `src/utils/getPickResults.test.ts` — spread scoring (favorite covers / fails to cover, underdog, push, tie, half-point spread, missing pick vs missing game, live and upcoming state). `getPickResults` is exported from `getPlayerScores.ts` for this. `getPlayerScores` itself is not directly testable: it takes an `ArrayBuffer` workbook and calls `getLeagueResults`, which hits ESPN.
- `src/context/ToastContext.test.tsx` — queue cap of 3, removal by id, 5-second auto-dismiss. Uses fake timers, so `userEvent.setup` is passed `advanceTimers`.
- `src/components/table/explanation/ExplanationTable.test.tsx` — headers, per-pick status classes, explanation toasts. Mocks `useToastContext`.
- `src/components/RakSadness.test.tsx` — week lookup, localhost picks-fetch skip, upload, results views, refresh, export. Mocks `getLeagueInfo`, `getPlayerScores`, `buildSpreadsheetBuffer`.

Writing a component test here:

- Mount `RakSadness` inside `ToastContextProvider` with `Toaster` beside it, like `index.tsx` does. Toasts render in `Toaster`, so without it no toast assertion can pass.
- The week `Select` compares option values by reference, so a fixture's `activeWeek` must be the same object as its entry in `weeks`.
- Don't name a helper `render*` unless it returns the render result — `testing-library/render-result-naming-convention` is an error, not a warning.
- `testing-library/no-node-access` is off for test files (`.eslintrc.json` overrides): the file input is hidden and the navbar buttons are only identifiable by class.

Tests print a lot of `console.debug` from the scoring path. Expected, not a failure.

## Gotchas

- `make run`: set `BROWSER=none` for a headless start, or CRA opens a browser tab. `make run PORT=3001` moves it, which is how you get two dev servers side by side.
- Sass prints `legacy-js-api` deprecation warnings on every dev-server compile. Noise, not breakage.
- One ESLint config: `.eslintrc.json`, extending `react-app` and `react-app/jest` alongside the TypeScript and import presets. `package.json` has no `eslintConfig` key. `npm run lint` and the lint pass inside `react-scripts build` now enforce the same rules. Keep it that way — a second surface means rules that silently apply to only one.
- Lint is warning-free and must stay so: `CI=true npm run build` (which is what a Cloudflare Pages CI build does) treats warnings as errors.
- `make format` runs `eslint --fix` first, then prettier. That order matters: eslint's fixes are not prettier-clean, so the formatter has to run last or `make check` fails right after `make format`.
- Root `tsconfig.json` excludes `functions/**/*`, so `make typecheck` runs `tsc` twice, once per config.

## Cloudflare Pages, not wrapped in make

- `npm run pages:dev` works: wrangler proxies on 3000, CRA runs on 3001 (`PORT=3001` in the script). Verified serving `/` 200 and executing the Pages Function. No make target wraps it because wrangler warns the `-- <command>` form is deprecated, so this script is on borrowed time.
- `wrangler.toml` holds `name = "rak-sadness"` (the real Pages project), `compatibility_date`, and the `RAK_SADNESS_BUCKET` R2 binding pointing at the `rak-sadness` bucket.
- **Do not add `pages_build_output_dir` to `wrangler.toml`.** It makes `pages:dev` fail with `Specify either a directory OR a proxy command, not both`, because that script uses proxy mode to keep hot reload. Its absence is deliberate.
- `functions/api/picks/[week].ts` reads `picks/<week>.xlsx` from the binding. Locally the bucket is simulated and empty, so `/api/picks/:week` returns 404 until seeded: `wrangler r2 object put rak-sadness/picks/1.xlsx --file <path> --local`.
- The Cloudflare Pages build passed on the branch that added this `wrangler.toml`, so the config does not break the git-triggered build. `npm run pages:deploy` from a laptop has still never run against it.
- Not a blocker for local work: `src/components/RakSadness.tsx` deliberately skips that fetch on localhost and falls back to manual spreadsheet upload.
- `npm run pages:deploy` needs Cloudflare auth (`wrangler login`, or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). Deliberately not a make target: deploying is not an agent action to take unprompted.
- Wrangler is pinned at 3.x and warns that 4.x is out.

## Offline

`make setup` needs network (`npm ci`). `make build`, `make check`, `make test`, `make run` work offline once `node_modules` exists. `make run` fetches live ESPN endpoints at runtime (`src/utils/getLeagueInfo.ts`, `getLeagueResults.ts`), so scoring needs network even though the dev server does not.

---
name: build-run-test
description: How to build, run, and test this repo. Read before any npm, make, tsc, eslint, prettier, vitest, or wrangler command here, before adding a Makefile target, before touching CI. Make targets, node version, ports, Cloudflare prereqs, known gotchas.
---

# Build, run, test

`make help` lists targets. Run targets, not raw npm scripts.

## Toolchain

- Vite 8, React 19, TypeScript 6, Vitest 4, ESLint 9 flat config, wrangler 4.
- Node `v22` (`.nvmrc`), npm 10 (`lockfileVersion: 3`). `nvm use` before anything. wrangler 4 refuses to run on Node 20, and jsdom 30 needs `>=22.22.2`. `make setup` fails with an actionable message on a major mismatch.
- Three CI signals on a PR: `check` (`.github/workflows/check.yml`) runs the same `make check` you run locally, `conventional-commit-title` (`.github/workflows/pr-title.yml`) matches the title format, and `Cloudflare Pages` builds from git using the dashboard's own settings. Break `make check` locally and CI breaks the same way.

## Verified

From a clean checkout: `make setup`, `make build`, `make run`, `make test`, `make check` all green. `make run` serves `http://localhost:3000`, HTTP 200, `<title>Rak Madness Scoreboard</title>`. `npm audit` reports 0 vulnerabilities.

`npm run build` runs `npm run typecheck` first, so a type error fails the Cloudflare build too. Nothing lints during the build any more, unlike Create React App; lint reaches CI through the `check` workflow calling `make check`.

## Tests

151 cases, 13 suites, all offline. `npm test` is `vitest run`; `npm run test:watch` watches.

- `src/utils/getPickResults.test.ts` — spread scoring (favorite covers / fails to cover, underdog, push, tie, half-point spread, missing pick vs missing game, live and upcoming state). Also pins the statuses `GameStatus` does not model: ESPN sends type ids for postponed and canceled, they land in the same branch as a live game, and a canceled game has no winner so every pick scores a point.
- `src/utils/getPlayerScores.test.ts` — workbook parsing, matchup derivation, per-league scoring, tiebreaker distance, the whole sort order, every knockout branch. Builds a real workbook with `xlsx-js-style` and mocks `getLeagueResults`.
- `src/utils/buildSpreadsheetBuffer.test.ts` — writes a workbook, reads it back, asserts both sheets, headers, rows, and per-status fill colors. Reading a workbook back flattens the fill onto `cell.s`, so it is `cell.s.fgColor.rgb`, not `cell.s.fill.fgColor.rgb`.
- `src/utils/getLeagueInfo.test.ts` — endpoint URLs, calendar and week mapping, active-calendar choice per league, the off-season calendar that arrives with no `entries`.
- `src/utils/getLeagueResults.test.ts` — pro and college request URLs, the college week offset, the postseason collapse to week 1, event mapping, matchup filtering.
- `src/context/ToastContext.test.tsx` — queue cap of 3, removal by id, 5-second auto-dismiss.
- `src/components/RakSadness.test.tsx` — week lookup, localhost picks-fetch skip, upload, results views, refresh, export.
- `ExplanationTable`, `ScoresTable`, `Navbar`, `LogoButton`, `Footer`, `Toaster` each have their own suite.

Writing a test here:

- Fixture games come from `src/utils/leagueResultFixtures.ts` (`finalGame`, `upcomingGame`). Use them instead of hand-rolling a `LeagueResult`.
- Mount `RakSadness` inside `ToastContextProvider` with `Toaster` beside it, like `index.tsx` does. Toasts render in `Toaster`, so without it no toast assertion can pass.
- The week `Select` compares option values by reference, so a fixture's `activeWeek` must be the same object as its entry in `weeks`.
- Don't name a helper `render*` unless it returns the render result — `testing-library/render-result-naming-convention` is an error, not a warning.
- `testing-library/no-node-access` is off for test files (`eslint.config.js` override): the file input is hidden and the navbar buttons are only identifiable by class. `testing-library/no-container` is on, so reach for `screen` queries.
- `mockReset` is on in `vite.config.ts`, matching what Create React App used to do. Set mock implementations in `beforeEach`, not at module scope.
- `src/setupTests.ts` shims a `jest` global. `@testing-library/dom` looks for it to decide whether fake timers are installed, and without it every interaction in a `vi.useFakeTimers()` suite times out. Don't remove it.
- Import `Mock` / `MockedFunction` from `vitest`. `vi`, `describe`, `it`, and `expect` are globals (`globals: true`).

Tests print a lot of `console.debug` from the scoring path. Expected, not a failure.

## Gotchas

- Vite does not open a browser, so there is no `BROWSER=none` to set. `make run PORT=3001` moves the port, which is how you get two dev servers side by side. `strictPort` is on, so a busy port fails instead of silently sliding to the next one.
- Sass prints deprecation warnings on compile. Noise, not breakage.
- One ESLint config: `eslint.config.js` (flat). It names its plugins directly rather than going through `react-app`, which came from `react-scripts`. `package.json` has no `eslintConfig` key and there is no `.eslintrc.json`.
- `import/no-unresolved` is off. `tsc` already resolves modules for both tsconfigs, and the import plugin misreads ESM exports maps without its own resolver.
- `.wrangler/` is in the ESLint ignore list. It holds generated bundles that fail every rule.
- `make format` runs `eslint --fix`, then prettier. That order matters: eslint's fixes are not prettier-clean, so the formatter has to run last or `make check` fails right after `make format`.
- Two tsconfigs, and root excludes `functions/**/*`, so `make typecheck` runs `tsc` twice. Both set `strict: true` explicitly, because TypeScript 6 changed the default and leaving it implicit hides which behavior is intended.
- `src/vite-env.d.ts` carries the `vite/client` and `vitest/globals` references. Don't move them into `compilerOptions.types`: that switches off automatic `@types` inclusion and VS Code reports the entry point as missing.
- `.vscode/settings.json` points the editor at the workspace TypeScript. VS Code bundles 5.x and misreads a TypeScript 6 config.

## Cloudflare Pages, not wrapped in make

- `npm run pages:dev` builds, then runs `wrangler pages dev ./build --port 3000`. Verified on wrangler 4: `/` serves 200, the Pages Function executes, assets serve. This is the supported form; the older `pages dev -- <command>` proxy form is deprecated and gone from this repo.
- `pages:dev` serves a build, so there is no hot reload. Two workflows, on purpose: `make run` for iterating on the UI, `pages:dev` for anything touching the Function or the binding. Rerun it to pick up a code change.
- No make target wraps `pages:dev` because it needs Cloudflare context that `make` targets deliberately stay out of.
- `wrangler.toml` holds `name = "rak-sadness"` (the real Pages project), `compatibility_date`, and the `RAK_SADNESS_BUCKET` R2 binding pointing at the `rak-sadness` bucket. It configures `pages dev` only. `pages deploy` skips the file completely, because Pages only reads it when `pages_build_output_dir` is set, which is why `pages:deploy` passes `--project-name` on the command line. Without that flag the command fails with `Missing Pages project name`.
- **Do not add `pages_build_output_dir` to `wrangler.toml`.** Its absence is what keeps the file local-development-only. Adding it makes wrangler.toml the source of truth for production builds and overrides the dashboard's own build settings, which is where this project's real config lives.
- `functions/api/picks/[week].ts` reads `picks/<week>.xlsx` from the binding. Locally the bucket is simulated and empty, so `/api/picks/:week` returns 404 until seeded: `wrangler r2 object put rak-sadness/picks/1.xlsx --file <path> --local`.
- Not a blocker for local work: `src/components/RakSadness.tsx` deliberately skips that fetch on localhost and falls back to manual spreadsheet upload.
- `npm run pages:deploy` needs Cloudflare auth (`wrangler login`, or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). Deliberately not a make target: deploying is not an agent action to take unprompted.
- Verified against the live project: it uploads, `/` serves 200, the Function runs, and `/api/picks/1` returns the real spreadsheet, so direct-upload deployments do get the dashboard's bucket binding. Give a fresh deployment a few seconds before probing it; the assets go live before the Functions routing does.
- **The branch decides the environment.** The production branch is `main`, and `pages deploy` infers the branch from git, so a deploy from anywhere else is a preview on its own subdomain. Pass `--branch` explicitly rather than trusting the inference. The project is also git-connected, so pushing already builds a preview; deploy by hand only to test the command.

## Offline

`make setup` needs network (`npm ci`). `make build`, `make check`, `make test`, `make run` work offline once `node_modules` exists. `make run` fetches live ESPN endpoints at runtime (`src/utils/getLeagueInfo.ts`, `getLeagueResults.ts`), so scoring needs network even though the dev server does not.

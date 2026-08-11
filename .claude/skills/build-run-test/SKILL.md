---
name: build-run-test
description: How to build, run, and test this repo. Read before any npm, make, tsc, eslint, prettier, vitest, or wrangler command here, before adding a Makefile target, before touching CI. Make targets, node version, ports, Cloudflare prereqs, known gotchas.
---

# Build, run, test

`make help` lists targets. Run targets, not raw npm scripts.

## Toolchain

- Vite 8, React 19, TypeScript 6, Vitest 4, ESLint 9 flat config, wrangler 4.
- Base UI for behavior, react-router 7 for routing, SCSS for looks. Base UI ships no styles, so every visual lives in SCSS against the `--rak-*` tokens in `src/index.scss`. There is no theme provider. Icons are inlined SVGs in `src/components/icon/`, with the path data copied from Material Design.
- Node `v22` (`.nvmrc`), npm 10 (`lockfileVersion: 3`). `nvm use` before anything. wrangler 4 refuses to run on Node 20, and jsdom 30 needs `>=22.22.2`. `make setup` fails with an actionable message on a major mismatch.
- Three CI signals on a PR: `check` (`.github/workflows/check.yml`) runs the same `make check` you run locally, `conventional-commit-title` (`.github/workflows/pr-title.yml`) matches the title format, and `Cloudflare Pages` builds from git using the dashboard's own settings. Break `make check` locally and CI breaks the same way.

## Verified

From a clean checkout: `make setup`, `make build`, `make run`, `make test`, `make check` all green. `make run` serves `http://localhost:3000`, HTTP 200, `<title>The Rakulator</title>`. `npm audit` reports 0 vulnerabilities.

`npm run build` runs `npm run typecheck` first, so a type error fails the Cloudflare build too. The build does not lint. Lint reaches CI through the `check` workflow calling `make check`.

## Tests

Every suite sits beside the module it covers, and they all run offline. `npm test` is `vitest run`; `npm run test:watch` watches. `src/App.test.tsx` is the widest one: it mounts the routed app and covers the week lookup, the picks fetch, upload, both results views, refresh, export, and the week route guard.

Writing a test here:

- Fixture games come from `src/utils/leagueResultFixtures.ts` (`finalGame`, `upcomingGame`). Use them instead of hand-rolling a `LeagueResult`.
- Reading an exported workbook back flattens the fill onto `cell.s`, so assert `cell.s.fgColor.rgb`, not `cell.s.fill.fgColor.rgb`.
- jsdom reports no layout: every rect is zero and `window.innerHeight` is 768. Anything that measures the page has its arithmetic tested apart from the hook that feeds it.
- Mount `App` the way `index.tsx` does: inside `MemoryRouter`, `ToastContextProvider`, and `AppDataContextProvider`, with `Toaster` beside it. Toasts render in `Toaster`, so without it no toast assertion can pass.
- Clear `localStorage` in `beforeEach` for anything that uploads. An upload caches its workbook per week, and jsdom keeps storage between cases, so a later case would find picks an earlier one left behind.
- `mountLoadedApp` waits for the home controls, so it only works for URLs that land on `/`. Deep-link cases use `mountApp` and await something on the results route.
- The week `Select` compares option values by reference, so a fixture's `activeWeek` must be the same object as its entry in `weeks`.
- Don't name a helper `render*` unless it returns the render result — `testing-library/render-result-naming-convention` is an error, not a warning.
- `testing-library/no-node-access` is off for test files (`eslint.config.js` override): the file input is hidden and the navbar buttons are only identifiable by class. `testing-library/no-container` is on, so reach for `screen` queries.
- `mockReset` is on in `vite.config.ts`. Set mock implementations in `beforeEach`, not at module scope.
- `src/setupTests.ts` shims a `jest` global. `@testing-library/dom` looks for it to decide whether fake timers are installed, and without it every interaction in a `vi.useFakeTimers()` suite times out. Don't remove it.
- Import `Mock` / `MockedFunction` from `vitest`. `vi`, `describe`, `it`, and `expect` are globals (`globals: true`).

The scoring path logs through `src/utils/debugLog.ts`, which is silent when the Vite mode is `test`. Console output during a test run is now a signal, not background noise.

## Gotchas

- `GameStatus` models only upcoming, live, and final, but `status` is assigned straight from ESPN's `status.type.id`, which also has ids for postponed and canceled. Those reach the same branch as a live game, so the header reads "Live Score" and ESPN's detail message is what tells the reader otherwise. A canceled game has no winner, so every pick on it scores a point.
- Vite does not open a browser, so there is no `BROWSER=none` to set. `make run PORT=3001` moves the port, which is how you get two dev servers side by side. `strictPort` is on, so a busy port fails instead of silently sliding to the next one.
- Sass prints deprecation warnings on compile. Noise, not breakage.
- Breakpoints are Sass mixins in `src/styles/_breakpoints.scss`, not custom properties, because custom properties do not work inside a media query. `@use "…/styles/breakpoints" as *;` then `@include narrow-screen { … }` for phone width, or `@include crowded-navbar { … }` for the wider point where the navbar stops labelling its buttons.
- `index.html` asks for `viewport-fit=cover`, which is what makes `env(safe-area-inset-*)` non-zero. The table's trailing row sizes itself from the bottom inset; `PageLayout.scss` holds back the other three sides. Removing `viewport-fit=cover` silently collapses all of that to zero.
- One ESLint config: `eslint.config.js` (flat). It names its plugins directly. `package.json` has no `eslintConfig` key and there is no `.eslintrc.json`.
- `import/no-unresolved` is off. `tsc` already resolves modules for both tsconfigs, and the import plugin misreads ESM exports maps without its own resolver.
- `.wrangler/` is in the ESLint ignore list. It holds generated bundles that fail every rule.
- `make format` runs `eslint --fix`, then prettier. That order matters: eslint's fixes are not prettier-clean, so the formatter has to run last or `make check` fails right after `make format`.
- Two tsconfigs, and root excludes `functions/**/*`, so `make typecheck` runs `tsc` twice. Both set `strict: true` explicitly, because TypeScript 6 changed the default and leaving it implicit hides which behavior is intended.
- `src/vite-env.d.ts` carries the `vite/client` and `vitest/globals` references. Don't move them into `compilerOptions.types`: that switches off automatic `@types` inclusion and VS Code reports the entry point as missing.
- `.vscode/settings.json` points the editor at the workspace TypeScript. VS Code bundles 5.x and misreads a TypeScript 6 config.

## Cloudflare Pages, not wrapped in make

**Nothing in this repo deploys.** Cloudflare builds the site itself from git, using the build settings in its own dashboard: push to `main` for production, push any other branch for a preview. There is no deploy script, and adding one would create a second path to production that ignores those settings. wrangler is here for local testing only.

- `npm run pages:dev` builds, then runs `wrangler pages dev ./build --port 3000`. Verified on wrangler 4: `/` serves 200, the Pages Function executes, assets serve. This is the supported form; the older `pages dev -- <command>` proxy form is deprecated and gone from this repo.
- `pages:dev` serves a build, so there is no hot reload. Two workflows, on purpose: `make run` for iterating on the UI, `pages:dev` for anything touching the Function or the binding. Rerun it to pick up a code change.
- No make target wraps `pages:dev` because it needs Cloudflare context that `make` targets deliberately stay out of.
- `wrangler.toml` holds `name = "rak-sadness"` (the real Pages project, which Cloudflare cannot rename), `compatibility_date`, and the `RAK_MADNESS_BUCKET` R2 binding pointing at the `rak-madness-calculator` bucket. It configures `pages dev` and nothing else. The same binding has to exist on the Pages project itself, for preview and production both.
- **Do not add `pages_build_output_dir` to `wrangler.toml`.** Its absence is what keeps the file local-development-only. Adding it makes wrangler.toml the source of truth for production builds and overrides the dashboard settings the real build uses.
- `functions/api/picks/index.ts` lists the seasons that have picks, and `functions/api/picks/[year]/[week].ts` reads `picks/<year>/<week>.xlsx` from the binding. Locally the bucket is simulated and empty, so `/api/picks` comes back with an empty list and `/api/picks/<year>/<week>` returns 404 until seeded: `wrangler r2 object put rak-madness-calculator/picks/2025/1.xlsx --file <path> --local`.
- The client checks the response's content type before parsing it, because `make run` has no Function behind it and answers both routes with the app's own HTML at 200. So the API path works for real under `pages:dev` with a seeded bucket, and falls back to manual upload under `make run`.
- `wrangler *` and `npx wrangler *` sit in `ask`, because seeding a bucket or reading account state is not an agent action to take unattended.

## Offline

`make setup` needs network (`npm ci`). `make build`, `make check`, `make test`, `make run` work offline once `node_modules` exists. `make run` fetches live ESPN endpoints at runtime (`src/utils/getLeagueInfo.ts`, `getLeagueResults.ts`), so scoring needs network even though the dev server does not.

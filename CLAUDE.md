# rak-sadness-web

Auto-scoring web app for the Rak Madness football pool. Vite + React 19 + TypeScript, react-router, Base UI, SCSS. Vitest for tests, ESLint flat config. Scores an uploaded weekly picks spreadsheet against ESPN game results, exports XLSX. Home page at `/`, a week's results at `/week/:week/scoreboard` and `/week/:week/explanation`. Deployed to Cloudflare Pages (`wrangler`); `functions/api/picks/[week].ts` is the Pages Function serving stored picks.

## Subdirectories

- [`public/`](public/CLAUDE.md) — static assets copied to the build root
- [`src/`](src/CLAUDE.md) — application source

## Maintaining this tree

Navigation index. Changed a dir: update its CLAUDE.md summary and the parent's
link. New meaningful dir: add a CLAUDE.md, link it. Pointer <= 70 chars.

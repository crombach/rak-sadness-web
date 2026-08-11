# rak-madness-calculator

Auto-scoring web app for the Rak Madness football pool. Vite + React 19 + TypeScript, react-router, Base UI, SCSS. Vitest for tests, ESLint flat config. Scores an uploaded weekly picks spreadsheet against ESPN game results, exports XLSX. Home page at `/`, a week's results at `/:season/:week/scoreboard` and `/:season/:week/picks`, and `/scoreboard` and `/picks` redirect to the latest week worth showing. Deployed to Cloudflare Pages (`wrangler`); `functions/api/picks/index.ts` lists the seasons that have picks, and `functions/api/picks/[year]/[week].ts` serves one season's week.

## Subdirectories

- [`public/`](public/CLAUDE.md) — static assets copied to the build root
- [`src/`](src/CLAUDE.md) — application source

## Maintaining this tree

Navigation index. Changed a dir: update its CLAUDE.md summary and the parent's
link. New meaningful dir: add a CLAUDE.md, link it. Pointer <= 70 chars.

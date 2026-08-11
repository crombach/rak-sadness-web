# rak-madness-calculator

Auto-scoring web app for the Rak Madness football pool. Vite + React 19 + TypeScript, react-router, Base UI, SCSS. Vitest for tests, ESLint flat config. Scores an uploaded weekly picks spreadsheet against ESPN game results, exports XLSX. Home page at `/`, a week's results at `/:season/:week/scoreboard` and `/:season/:week/picks`, and `/scoreboard` and `/picks` redirect to the latest week worth showing. Deployed to Cloudflare Pages (`wrangler`); `functions/api/picks/index.ts` lists the seasons that have picks, and `functions/api/picks/[year]/[week].ts` serves one season's week.

`public/` holds the static assets Vite copies to the build root, referenced by
absolute path: `manifest.json` PWA metadata, the `favicon.ico` and `logo*.png`
icons, and `robots.txt`, which disallows every crawler. The HTML shell is
`index.html` at the repo root, not in there. It carries no `CLAUDE.md` of its own,
because everything in it is published, and a note to Claude is not for the web.

## Subdirectories

- [`src/`](src/CLAUDE.md) — application source

## Maintaining this tree

Navigation index. Changed a dir: update its CLAUDE.md summary and the parent's
link. New meaningful dir: add a CLAUDE.md, link it. Pointer <= 70 chars.
`public/` is the exception: it is served as-is, so it is described above instead.

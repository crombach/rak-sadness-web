# rak-madness-calculator

Auto-scoring web app for the Rak Madness football pool. Vite + React 19 +
TypeScript, react-router, Base UI, SCSS. Vitest for tests, ESLint flat config.
Scores an uploaded weekly picks spreadsheet against ESPN game results, exports XLSX.
Home page at `/`, a week's results at `/:season/:week/scoreboard` and
`/:season/:week/picks`, and `/scoreboard` and `/picks` redirect to the latest week
worth showing. Deployed to Cloudflare Pages (`wrangler`);
`functions/api/picks/index.ts` lists the seasons that have picks, and
`functions/api/picks/[year]/[week].ts` serves one season's week.

`public/` holds the static assets Vite copies to the build root, referenced by
absolute path: `manifest.json`, the `favicon.ico` and `logo*.png` icons, and
`robots.txt`. The HTML shell is `index.html` at the repo root.

## Subdirectories

- [`src/`](src/CLAUDE.md) — application source

## Maintaining this tree

Navigation index. Changed a dir: update its CLAUDE.md summary and the parent's
link. New meaningful dir: add a CLAUDE.md, link it. Pointer <= 70 chars. Every
CLAUDE.md: 120 words max outside its Subdirectories list and this block. Ceiling,
not target, and `make lint-docs` enforces it. Over it, the detail belongs at the
point of definition, in a comment or docblock beside the code. A skill under
`.claude/skills/` is for what no one file can hold. `public/` is the exception to
the tree: it is served as-is, so it is described above instead.

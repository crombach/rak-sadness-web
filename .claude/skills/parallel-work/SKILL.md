---
name: parallel-work
description: Which parts of this repo are safe to edit at the same time. Read before splitting work across parallel agents, git worktrees, or subagents here, and before a change touching more than one module. Independent modules, shared state forcing serialization, known collision hotspots.
---

# Parallel work

Single build root, one `package.json`, one `package-lock.json`. No module boundaries to respect, so every collision here is file-level or port-level, not build-level.

## Serialize these

- **`package.json` + `package-lock.json`** — one lockfile for the whole repo. Two agents adding dependencies in separate worktrees both rewrite it; the merge is a conflict every time. One agent owns dependency changes per branch.
- **`src/components/RakSadness.tsx`** (429 lines) — app root: week select, spreadsheet upload, `/api/picks/:week` fetch, score calc, XLSX export. Nearly every UI feature lands here. Two agents on unrelated UI work still collide. Split by giving one agent this file and the other a leaf component.
- **`src/utils/getPlayerScores.ts`** (576 lines) — all scoring, knockout, and tiebreaker logic in one file. Same story: scoring changes serialize.
- **Port 3000** — separate worktrees still contend for the same localhost port. Not a blocker: `make run PORT=3001` moves the dev server, so the second agent overrides instead of taking the default. `npm run pages:dev` occupies 3000 and 3001 together.

## Watch, don't serialize

- `src/setupTests.ts` is shared by every suite, but it holds one import line and rarely changes.
- Each `*.test.*` file pairs with one source file, so test work splits the same way the source does. Two agents adding suites for different files do not collide.

## Safe in parallel

- Leaf components under `src/components/` (`footer/`, `navbar/`, `toaster/`, `table/explanation/`, `table/playerName/`) — each is its own `.tsx` + `.scss` pair, no cross-imports between them.
- `src/utils/` files other than `getPlayerScores.ts`: `getLeagueInfo.ts`, `getLeagueResults.ts`, `buildSpreadsheetBuffer.ts`, `getClasses.ts`, `rangeWithPrefix.ts`.
- `functions/api/picks/[week].ts` — Cloudflare Pages Function, touched by nothing in `src/` except the fetch URL.
- `public/` static assets.

## Cleared

- No shared `build/`-style output across worktrees; each worktree gets its own `build/` and `node_modules/`.
- No `.env` files, no docker-compose services, no shared database, no fixed host:port literals in config.
- `~/.npm` cache is lock-safe under concurrent `npm ci`.

## Note

`src/types/` is imported by 5 files, but type files are append-mostly and rarely conflict. Watch it, don't serialize on it.

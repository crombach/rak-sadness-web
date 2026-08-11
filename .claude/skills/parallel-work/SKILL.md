---
name: parallel-work
description: Which parts of this repo are safe to edit at the same time. Read before splitting work across parallel agents, git worktrees, or subagents here, and before a change touching more than one module. Independent modules, shared state forcing serialization, known collision hotspots.
---

# Parallel work

Single build root, one `package.json`, one `package-lock.json`. No module boundaries to respect, so every collision here is file-level or port-level, not build-level.

## Serialize these

- **`package.json` + `package-lock.json`** — one lockfile for the whole repo. Two agents adding dependencies in separate worktrees both rewrite it; the merge is a conflict every time. One agent owns dependency changes per branch.
- **`src/context/AppDataContext.tsx`** — the week list, picks, and scores for the whole app. Small, but every data change passes through what it exposes, so two agents adding state both touch it.
- **Port 3000** — separate worktrees still contend for the same localhost port. Not a blocker: `make run PORT=3001` moves the dev server, so the second agent overrides instead of taking the default. `npm run pages:dev` occupies 3000 and 3001 together.

## Watch, don't serialize

- `src/setupTests.ts` is shared by every suite, but it holds one import line and rarely changes.
- `src/App.test.tsx` is the only suite covering both routes end to end, so two agents adding cases for different pages do land in the same file.
- `src/styles/_breakpoints.scss` and `src/index.scss` hold shared tokens. Small and append-mostly.
- Each `*.test.*` file pairs with one source file, so test work splits the same way the source does. Two agents adding suites for different files do not collide.

## Safe in parallel

- Leaf components under `src/components/` (`footer/`, `navbar/`, `toaster/`) — each is its own `.tsx` + `.scss` pair, no cross-imports between them.
- `table/picks/` and `table/playerName/` — `PicksTable` imports `PlayerName`, so a change to `PlayerName`'s props touches both.
- Route components: `home/HomePage.tsx` and the route files in `results/`
  (`CurrentWeekRedirect.tsx`, `PicksRoute.tsx`, `ResultsLayout.tsx`,
  `ScoreboardRoute.tsx`), each owning one route. `ResultsFrame.tsx` is the page
  frame `ResultsLayout` and `CurrentWeekRedirect` share.
- `src/hooks/` — one hook per file (including `usePicksSeasons.ts`), and only
  `AppDataContext` mounts more than one.
- `src/utils/scoring/` — one concern per file, so it does not serialize on a single module, though `getPlayerScores.ts` sequences the others, so a change to the pipeline's shape still touches it.
- `src/utils/` leaves: `getLeagueInfo.ts`, `getLeagueResults.ts`, `buildSpreadsheetBuffer.ts`, `picksCache.ts`, `debugLog.ts`, `getClasses.ts`, `rangeWithPrefix.ts`.
- `functions/api/picks/index.ts` and `functions/api/picks/[year]/[week].ts` — Cloudflare Pages Functions, touched by nothing in `src/` except the fetch URLs.
- `public/` static assets.

## Cleared

- No shared `build/`-style output across worktrees; each worktree gets its own `build/` and `node_modules/`.
- No `.env` files, no docker-compose services, no shared database, no fixed host:port literals in config.
- `~/.npm` cache is lock-safe under concurrent `npm ci`.

## Note

`src/types/` is imported by 31 files, but type files are append-mostly and rarely conflict. Watch it, don't serialize on it.

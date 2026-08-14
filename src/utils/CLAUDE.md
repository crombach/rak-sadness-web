# src/utils

- `getLeagueInfo` / `getLeagueResults`: ESPN fetch, calendar, week mapping,
  `getGameResult` by event id
- `getRegularSeasonWeekCount`: a season's week count, cached
- `buildSpreadsheetBuffer`: the xlsx export and its content type
- `pickStatusFill`: pick colors for the export
- `picksCache` / `espnCache`: an uploaded workbook, and ESPN's fixed answers,
  on `localStorageCache`, a capped store under one prefix
- `loadStoredPicks`: a week's workbook from the API, or cache
- `debugLog`: scoring traces, silent outside a dev server
- `latestOnly`: drops an async result its effect outlived
- `getClasses`: className join, fixed and conditional names
- `plural`: a count and its noun, pluralized
- `rangeWithPrefix`: labeled index arrays (C1, C2…)
- `readFileToBuffer`: an upload's bytes
- `prefetchLink`: prefetch, no unused-preload console warning

## Subdirectories

- [`scoring/`](scoring/CLAUDE.md) — the picks-to-scoreboard pipeline

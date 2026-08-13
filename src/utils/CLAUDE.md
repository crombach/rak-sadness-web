# src/utils

- `getLeagueInfo` / `getLeagueResults`: ESPN fetch, calendar and week mapping,
  plus `getGameResult`, one game by event id
- `getRegularSeasonWeekCount`: a season's week count, cached
- `buildSpreadsheetBuffer`: the xlsx-js-style workbook export and its content type
- `pickStatusFill`: pick colors for the export
- `picksCache` / `espnCache`: localStorage, an uploaded workbook and the ESPN
  answers nothing can change
- `loadStoredPicks`: a week's workbook from the API, falling back to that cache
- `debugLog`: scoring traces, silent outside a dev server
- `latestOnly`: drops an async result its effect has outlived
- `getClasses`: className join, fixed and conditional names together
- `plural`: a count and its noun, pluralized
- `rangeWithPrefix`: labeled index arrays (C1, C2…)
- `readFileToBuffer`: an uploaded spreadsheet's bytes

## Subdirectories

- [`scoring/`](scoring/CLAUDE.md) — the picks-to-scoreboard pipeline

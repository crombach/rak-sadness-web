# src/utils

- `getLeagueInfo` / `getLeagueResults`: ESPN API fetch, calendar and week mapping
- `getRegularSeasonWeekCount`: a season's week count, cached per league and season
- `buildSpreadsheetBuffer`: the xlsx-js-style workbook export and its content type
- `pickStatusFill`: pick colors for the export
- `picksCache`: localStorage cache of an uploaded workbook, per season and week
- `loadStoredPicks`: a week's workbook from the API, falling back to that cache
- `debugLog`: scoring traces, silent outside a dev server
- `getClasses`: conditional className join
- `plural`: a count and its noun, pluralized
- `rangeWithPrefix`: labeled index arrays (C1, C2…)
- `readFileToBuffer`: an uploaded spreadsheet's bytes
- `leagueResultFixtures`: `finalGame`/`upcomingGame` builders for the tests here

## Subdirectories

- [`scoring/`](scoring/CLAUDE.md) — the picks-to-scoreboard pipeline

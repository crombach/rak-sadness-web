# src/utils

getLeagueInfo/getLeagueResults: ESPN API fetch, calendar/week mapping. getRegularSeasonWeekCount reads a season's regular-season week count from the ESPN calendar and caches it per league and season; the `WEEKS_*_REGULAR_SEASON` constants in getLeagueResults are fallbacks only. buildSpreadsheetBuffer: xlsx-js-style workbook export, and the xlsx content type. pickStatusFill: pick colors for the export, the same success, danger, and warning ramps `index.scss` draws them in, with a suite holding the two in step. picksCache: localStorage cache of an uploaded workbook, keyed by season and week, so a results URL survives a reload. debugLog: scoring traces, silent outside a dev server. getClasses: conditional className join. rangeWithPrefix: labeled index arrays (C1, C2…). readFileToBuffer: an uploaded spreadsheet's bytes, kept a module so suites can mock it.
leagueResultFixtures: `finalGame`/`upcomingGame` builders shared by the tests here.

## Subdirectories

- [`scoring/`](scoring/CLAUDE.md) — the picks-to-scoreboard pipeline

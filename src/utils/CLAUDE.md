# src/utils

getLeagueInfo/getLeagueResults: ESPN API fetch, calendar/week mapping. buildSpreadsheetBuffer: xlsx-js-style workbook export, and the xlsx content type. pickStatusFill: pick colors for the export, mirrored by `--rak-pick-*` tokens. picksCache: per-week localStorage cache of an uploaded workbook, so a results URL survives a reload. debugLog: scoring traces, silent outside a dev server. getClasses: conditional className join. rangeWithPrefix: labeled index arrays (C1, C2…). readFileToBuffer: an uploaded spreadsheet's bytes, kept a module so suites can mock it.
leagueResultFixtures: `finalGame`/`upcomingGame` builders shared by the tests here.

## Subdirectories

- [`scoring/`](scoring/CLAUDE.md) — picks to scoreboard: parsing, scoring, knockouts

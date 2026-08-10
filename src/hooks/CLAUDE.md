# hooks

The app's data layer. Everything that talks to ESPN, the picks API, or the scoring
pipeline lives here, so components only render.

- `useLeagueWeeks`: the season's weeks from ESPN, and which one is selected.
  `selectableWeeks` holds the calendar's own `WeekInfo` objects, because the week
  picker compares options by reference.
- `usePlayerScores`: the scores for a week, from the API, the local cache of an
  earlier upload, or a file the user picked. Owns the refresh throttle.
- `useExportScores`: downloads the current scores as a workbook.

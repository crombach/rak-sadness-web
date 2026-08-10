# hooks

The app's data layer. Everything that talks to ESPN, the picks API, or the scoring
pipeline lives here, so components only render. The first two are mounted once, in
`AppDataContext`, above the routes.

- `useLeagueWeeks`: the season's weeks from ESPN, and which one is selected. Takes
  the week the user arrived asking for, so a results URL is not preceded by
  scoring the current week. `selectableWeeks` holds the calendar's own `WeekInfo`
  objects, because the week picker compares options by reference.
- `usePlayerScores`: the scores for a week, from the API, the local cache of an
  earlier upload, or a file the user picked. Owns the refresh throttle.
  `settledWeek` says which week it has finished trying, which is what lets the
  route guard tell "no results" from "not yet".
- `useExportScores`: downloads the current scores as a workbook.
- `useWeekRouteGuard`: whether a `/week/:week` URL has anything to show, and the
  redirect home when it does not.

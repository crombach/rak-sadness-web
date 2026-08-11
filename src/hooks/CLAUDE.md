# hooks

The app's data layer. Everything that talks to ESPN, the picks API, or the scoring
pipeline lives here, so components only render. The first four are mounted once, in
`AppDataContext`, above the routes.

- `usePicksSeasons`: the seasons that have picks, from `/api/picks`, newest first.
- `useCurrentSeason`: the season running now, asked of ESPN with no season named.
  Its own lookup, because the picker has to offer that season whether or not it has
  picks yet, and the list above holds only the ones that do.
- `useLeagueWeeks`: the season's weeks from ESPN, and which one is selected. Takes
  the week the URL names and the season to fetch, so a results URL is not preceded
  by scoring the wrong week, and stays disabled until the season is known. The
  week is read when the calendar lands, so changing it costs no lookup.
  `seasonYear` says which season the week list actually describes.
  `selectableWeeks` holds the calendar's own `WeekInfo` objects, because the week
  picker compares options by reference.
- `usePlayerScores`: the scores for a week, from the API, the local cache of an
  earlier upload, or a file the user picked. Owns the refresh throttle.
  `settledWeek` says which week it has finished trying, which is what lets the
  route guard tell "no results" from "not yet".
- `useExportScores`: downloads the current scores as a workbook.
- `useWeekRouteGuard`: whether a `/:season/:week` URL has anything to show, and the
  redirect home when it does not.
- `useFillerRows`: how many empty rows a table needs to reach the bottom of the
  viewport. `fillerRowCount` is the measurement on its own, which is where the
  behavior is tested.

# hooks

The app's data layer. Everything that talks to ESPN, the picks API, or the scoring
pipeline lives here, so components only render. The first four are mounted once, in
`AppDataContext`, above the routes.

- `usePicksSeasons`: the seasons that have picks, from `/api/picks`, newest first
- `useCurrentSeason`: the season running now, asked of ESPN
- `useLeagueWeeks`: the season's weeks from ESPN, and which one is selected
- `usePlayerScores`: a week's scores from the API, cache, or an uploaded file.
  Owns the refresh throttle
- `useExportScores`: downloads the current scores as a workbook
- `useWeekRouteGuard`: whether a `/:season/:week` URL has anything to show, and
  the redirect home
- `useFillerRows`: the empty rows a table needs to reach the viewport's bottom

# scoring

The picks-to-scoreboard pipeline, a file per concern, sequenced by `getPlayerScores`.

- `parsePicksWorkbook`: xlsx buffer to rows, keys, matchups
- `parsePick`: one cell to a team and a spread
- `validateSpreads`: rows disagreeing on a spread
- `getPickResults`: picks scored, and `getStatus`
- `gameColumns`: `LEAGUES`, `LEAGUE_PREFIX`, `gameLabels`
- `weekGames`: each column and its game
- `getTiebreakerScore`: the Monday night total
- `scorePlayers`: per-player totals, sorted
- `comparePlayerScores`: rank order, on merit
- `isWeekDecided`: whether knockouts settled it
- `remainingGames`: the open games
- `unscoreableGames`: games nobody scores on
- `isWeekOver`: whether the week has a result
- `applyKnockouts`: who can still win, why not
- `getPlayerAnalysis`: what a player must do
- `leagueResultFixtures`: game builders for the tests

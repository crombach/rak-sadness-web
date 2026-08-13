# scoring

The picks-to-scoreboard pipeline, sequenced by `getPlayerScores`.

- `parsePicksWorkbook`: xlsx buffer to rows, keys, matchups
- `parsePick`: one cell to a team and a spread
- `validateSpreads`: rows disagreeing on a spread
- `marginAgainstSpread`: a side's margin, line applied
- `getPickResults`: picks scored, plus `getStatus`
- `gameColumns`: `LEAGUES`, `LEAGUE_PREFIX`, `gameLabels`
- `weekGames`: each column, its game, its line
- `getTiebreakerScore`: the Monday night total
- `scorePlayers`: per-player totals, sorted
- `comparePlayerScores`: rank order, on merit
- `isWeekDecided`: whether knockouts settled it
- `remainingGames`: the open games
- `unscoreableGames`: games nobody scores on
- `isWeekOver`: whether the week has finished
- `applyKnockouts`: who can still win, why not
- `getPlayerAnalysis`: what a player must do
- `leagueResultFixtures`: test game builders

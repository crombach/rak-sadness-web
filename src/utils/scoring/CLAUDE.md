# scoring

The picks-to-scoreboard pipeline, one concern per file. `getPlayerScores` sequences
the rest.

- `parsePicksWorkbook`: xlsx buffer to rows, keys, matchups
- `parsePick`: one cell to a team and a spread
- `validateSpreads`: rows that disagree on a spread
- `getPickResults`: picks scored, plus `getStatus`
- `gameColumns`: `LEAGUES` and `gameLabels`
- `getTiebreakerScore`: the Monday night total
- `scorePlayers`: per-player totals, sorted
- `comparePlayerScores`: rank order, and on merit
- `isWeekDecided`: whether the knockouts settled it
- `remainingGames`: the open games
- `unscoreableGames`: games nobody can be scored on
- `isWeekOver`: whether the week has a result
- `applyKnockouts`: who can still win, and why not
- `getPlayerAnalysis`: what a named player must do
- `leagueResultFixtures`: game builders for these tests

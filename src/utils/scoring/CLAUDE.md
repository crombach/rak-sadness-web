# scoring

The picks-to-scoreboard pipeline, sequenced by `getPlayerScores`.

- `parsePicksWorkbook`: xlsx buffer to rows, keys, matchups
- `parsePick`: a cell to team and spread
- `validateSpreads`: rows disagreeing on spread
- `marginAgainstSpread`: a side's margin, spread applied
- `getPickResults`: picks scored, plus `getStatus`
- `gameColumns`: `LEAGUES`, `LEAGUE_PREFIX`, `gameLabels`
- `weekGames`: each column, its game and line
- `getTiebreakerScore`: the Monday night total
- `scorePlayers`: per-player totals
- `comparePlayerScores`: rank order, on merit
- `isWeekDecided`: whether knockouts settled it
- `remainingGames`: the open games
- `unscoreableGames`: games nobody scores
- `isWeekOver`: whether the week finished
- `applyKnockouts`: who can still win, why not
- `scoreChanges`: what a refresh changed
- `getPlayerAnalysis`: what a player must do
- `leagueResultFixtures`: test game builders

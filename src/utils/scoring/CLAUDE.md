# scoring

The picks-to-scoreboard pipeline, one concern per file. `getPlayerScores` is the only
entry point the app calls for a week's results; everything else is a step it
sequences. `getPathsToVictory` is a second entry point, reading those results back.

- `parsePicksWorkbook`: xlsx buffer to rows, column keys, and per-game matchups.
  Async because it imports `xlsx-js-style` on demand, which is over half the bundle.
  Reads its column keys from the header row, not the first player's row, because
  `sheet_to_json` drops a blank cell from the object it builds
- `parsePick`: one cell to a team abbreviation and a spread. Anchors the spread to
  the end of the cell, so an abbreviation with a hyphen (`M-OH`) survives
- `validateSpreads`: the games whose rows contradict each other about the spread
- `getPickResults`: scores picks against game results, plus `getStatus`
- `getTiebreakerScore`: the Monday night game's real total, once it is final
- `scorePlayers`: per-player totals, sorted
- `comparePlayerScores`: the rank order. `comparePlayerScoresOnMerit` is every
  tiebreaker tier without the name that settles a dead heat, since two players the
  tiers leave tied have both won the week
- `isWeekDecided`: whether every game and the tiebreaker are settled, which is when
  whoever the knockouts left standing has won
- `applyKnockouts`: who can still win, and why not. Exports `remainingGameIndices`,
  which reads the open games a column at a time, because a blank cell scores
  "error" rather than "incomplete" and one row alone would drop a game that row's
  player skipped
- `getPathsToVictory`: the other half of `applyKnockouts`, for a player still
  standing. Walks every way the open games can fall, up to ten of them, and
  reduces the winning ones to the games that must go right, the pool the rest come
  from, and the Monday night totals that settle a dead heat on points. Where they
  do not reduce to a pool it lists the ten routes asking least of the player and
  counts the rest. Above ten open games it gives a floor from a closed form
  instead, since the search doubles per game

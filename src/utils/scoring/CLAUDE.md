# scoring

The picks-to-scoreboard pipeline, one concern per file. `getPlayerScores` is the only
entry point the app calls; everything else is a step it sequences.

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
- `comparePlayerScores`: the rank order and every tiebreaker tier
- `isWeekDecided`: whether every game and the tiebreaker are settled, which is when
  whoever the knockouts left standing has won
- `applyKnockouts`: who can still win, and why not

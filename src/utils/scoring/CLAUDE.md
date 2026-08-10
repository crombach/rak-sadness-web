# scoring

The picks-to-scoreboard pipeline, one concern per file. `getPlayerScores` is the only
entry point the app calls; everything else is a step it sequences.

- `parsePicksWorkbook`: xlsx buffer to rows, column keys, and per-game matchups.
  Async because it imports `xlsx-js-style` on demand, which is over half the bundle
- `parsePick`: one cell to a team abbreviation and a spread
- `getPickResults`: scores picks against game results, plus `getStatus`
- `getTiebreakerScore`: the Monday night game's real total, once it is final
- `scorePlayers`: per-player totals, sorted
- `comparePlayerScores`: the rank order and every tiebreaker tier
- `applyKnockouts`: who can still win, and why not

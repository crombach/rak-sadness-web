# gameStatus

How a game in the week is going, opened from a pick cell in the picks table.

- `GameStatusDialog`: `DialogShell` over a `DialogCombobox` of `scores.games`, in picks
  table column order. `gameSearchText` matches the column too, which is what a cell
  said. `GameMark` says where a game stands; `useLiveGame` keeps the chosen one fresh.
- `GameStatusSummary`: the game as ESPN's boxscore says it, over a link to ESPN's own
  tracker. Both sides sit in one grid, labels, names and records lined up. A wireframe
  stands in until the game has been fetched.
- `GameStatusSummary.scss`: one block between the sides holds both scores, the status
  over them, the down under. A phone gets each abbreviation, not each name.

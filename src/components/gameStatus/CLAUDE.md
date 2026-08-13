# gameStatus

How a game in the week is going, opened from a pick cell in the picks table.

- `GameStatusDialog`: `DialogShell` over a `DialogCombobox` of `scores.games`, in picks
  table column order. `gameSearchText` matches the column too, which is what a cell
  said. `GameMark` says where a game stands; `useLiveGame` keeps the chosen one fresh.
- `GameStatusSummary`: the pool's line, the game as ESPN's boxscore says it, and when
  and where it is played. Both sides sit in one grid. The wireframe is that layout with
  the week's own copy of the game in it, so it is the size the answer.
- `GameStatusSummary.scss`: one block holds both scores, the status over them, the
  down or the outcome under.

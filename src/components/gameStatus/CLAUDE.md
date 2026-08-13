# gameStatus

How a game in the week is going, opened from a pick cell in the picks table.

- `GameStatusDialog`: `DialogShell` over a `DialogCombobox` of `scores.games`, in picks
  table column order, which the query matches too. `GameMark` says where a game stands;
  `useLiveGame` keeps the chosen one fresh.
- `GameStatusSummary`: the pool's line, the game as ESPN's boxscore says it, its kickoff,
  Gamecast link and venue. The wireframe is that layout over the week's own copy of it,
  so a wait is the size of the answer.
- `GameStatusSummary.scss`: both sides in one grid, the dash in a track between two
  equal ones, so nothing either side moves it. `--rak-score-size` sizes that row; under
  `$breakpoint-marks` the marks come off.

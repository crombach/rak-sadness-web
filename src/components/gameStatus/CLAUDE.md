# gameStatus

How a game in the week is going, opened from a pick cell in the picks table.

- `GameStatusDialog`: `DialogShell` over a `DialogCombobox` of `scores.games`, in picks
  table column order. `gamesMatching` matches the column label as well as the teams,
  since a reader who came from a cell knows the label first. `useLiveGame` keeps the
  chosen game fresh.
- `GameStatusSummary`: the game the way ESPN's boxscore says it. Each side on its own
  edge with its name, record, and score, and between them the quarter scores once it is
  final, or the clock, the ball, and the down until then.
- `GameStatusSummary.scss`: three columns at `roomy-screen`, and under it the sides
  share a row with the middle below.

# gameStatus

How a game in the week is going, opened from a pick cell in the picks table.

- `GameStatusDialog`: `DialogShell` over a `DialogCombobox` of `scores.games`, in picks
  table column order. `gameSearchText` matches the column too, which is what a cell
  said. `GameMark` says where a game stands; `useLiveGame` keeps the chosen one fresh.
- `GameStatusSummary`: the game as ESPN's boxscore says it. Both sides are laid into
  one grid, so their labels, names and records line up across the middle. A wireframe
  stands in until the game has been fetched.
- `GameStatusSummary.scss`: the middle between the scores at `roomy-screen`, and under
  it below them, joined by a dash. A phone gets each team's abbreviation, not its name.

# table

- `TableShell`: the frame both results tables share, the filler rows carrying a
  short table to the bottom of the viewport, and the trailing row keeping the last
  real row clear of a phone's rounded corners. Takes `caption`, `ariaBusy` and
  `ariaHidden`.
- `Table.scss`: the shared `.table` styles, sticky header and player column, touch
  feedback, striped rows, the trailing row, the `.table__cell-button` a clickable
  cell holds, and the custom properties the wireframe measures against.
- `SkeletonTable`: the wireframe shown while a week's results are worked out,
  shaped like the view it stands in for, drawn from `styles/_skeleton.scss`.

## Subdirectories

- [`picks/`](picks/CLAUDE.md) — picks table, a cell opening its game
- [`playerName/`](playerName/CLAUDE.md) — name cell, shared status icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, default view

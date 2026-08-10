# table

`TableShell`: the frame both results tables share, the filler rows that carry a
short table down to the bottom of the viewport, and the trailing row that keeps the
last real row clear of a phone's rounded corners. `Table.scss` sizes that row from
`env(safe-area-inset-bottom)`, so it has no height on a screen without an inset,
publishes `--rak-table-row-height` for `useFillerRows` to measure against, and
holds the shared `.table` styles (sticky header and player column, pick status
colors, striped rows).

`SkeletonTable`: the pulsing wireframe shown while a week's results are being
worked out. Nothing but filler rows, so the shell sizes it.

## Subdirectories

- [`explanation/`](explanation/CLAUDE.md) — explanation-view table with pick toasts
- [`playerName/`](playerName/CLAUDE.md) — player name cell with knocked-out icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, the default results view

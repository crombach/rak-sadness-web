# table

`TableShell`: the frame both results tables share, the filler rows that carry a
short table down to the bottom of the viewport, and the trailing row that keeps the
last real row clear of a phone's rounded corners. `Table.scss` sizes that row from
`env(safe-area-inset-bottom)`, so it has no height on a screen without an inset,
publishes `--rak-table-row-height` for `useFillerRows` to measure against, and
holds the shared `.table` styles (sticky header and player column, the touch
feedback both clickable cells share, striped rows). Every measurement the wireframe
has to reproduce is a custom property on `.table`: cell padding, cell borders, and
the size of the icon beside a player's name. Change one there, not in two files.

`SkeletonTable`: the wireframe shown while a week's results are being worked out,
shaped like the view it stands in for. One sheen sweeps across the screen rather
than each of its ~1500 bars pulsing, which is a single compositor transform in
place of an animation per bar. Its cells hold no text: each
carries a `data-skeleton-text` stand-in that the stylesheet draws invisibly, so the
table's own `max-content` sizing gives the wireframe a real table's measurements at
any font size, and no placeholder reaches the page's text. No stand-in for a value
wraps, because no real value does either, so a wireframe row is one line tall like
a real one. Its header wraps on its own, with a floor of two lines so it still
reads as a header where a real heading fits on one.

## Subdirectories

- [`picks/`](picks/CLAUDE.md) — picks table, per-pick toasts
- [`playerName/`](playerName/CLAUDE.md) — name cell, knockout icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, default view

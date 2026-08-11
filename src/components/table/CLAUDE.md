# table

`TableShell`: the frame both results tables share, the filler rows that carry a
short table down to the bottom of the viewport, and the trailing row that keeps the
last real row clear of a phone's rounded corners. `Table.scss` sizes that row from
`env(safe-area-inset-bottom)`, so it has no height on a screen without an inset,
publishes `--rak-table-row-height` for `useFillerRows` to measure against, and
holds the shared `.table` styles (sticky header and player column, pick status
colors, striped rows).

`SkeletonTable`: the pulsing wireframe shown while a week's results are being
worked out, shaped like the view it stands in for. Its cells hold no text: each
carries a `data-skeleton-text` stand-in that the stylesheet draws invisibly, so the
table's own `max-content` sizing gives the wireframe a real table's measurements at
any font size, and no placeholder reaches the page's text. No stand-in for a value
wraps, because no real value does either, so a wireframe row is one line tall like
a real one. Its header wraps on its own, so it is as tall as the real header at
whatever width the table is being drawn.

## Subdirectories

- [`picks/`](picks/CLAUDE.md) — picks-view table with per-pick toasts
- [`playerName/`](playerName/CLAUDE.md) — player name cell with knocked-out icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, the default results view

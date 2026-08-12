# table

`TableShell`: the frame both results tables share, the filler rows that carry a
short table down to the bottom of the viewport, and the trailing row that keeps the
last real row clear of a phone's rounded corners. `Table.scss` makes that row one
row tall in the header's color, plus `env(safe-area-inset-bottom)` where the device
reports one, publishes `--rak-table-row-height` for `useFillerRows` to measure
against, and holds the shared `.table` styles (sticky header and player column, the
touch feedback both clickable cells share, striped rows). Every measurement the
wireframe has to reproduce is a custom property on `.table`: cell padding and cell
borders. Change one there, not in two files. The size of the icon beside a player's
name is in `src/index.scss` instead, because the player analysis search draws the
same icon and is nowhere near a table.

Takes an optional visually-hidden `caption`, the table's accessible name, and
`ariaBusy`/`ariaHidden`, which only `SkeletonTable` sets. A cell that opens
something is a real `<button className="table__cell-button">` inside its `<td>`,
so a keyboard can reach it and a screen reader announces it as a control. The `<td>`
keeps the fill, the border, and now `padding: 0`; the button carries that padding
instead and fills the cell edge to edge, so the whole cell is inside its own hit
area and the look is unchanged. `.table` no longer sets `user-select: none`: a real
button does not lose a tap to a drag the way a `role="button"` cell did, so table
text is selectable again. Status conveyed by fill color alone also gets a
`.table__sr-only` span (the `visually-hidden` mixin from `src/styles/_a11y.scss`)
inside the button, read by a screen reader and drawn nowhere.

An edge that carries no border is `0 solid var(--rak-primary-800)`, never `none`.
The shorthand resets the color to `currentColor`, which in the header is white.

`SkeletonTable`: the wireframe shown while a week's results are being worked out,
shaped like the view it stands in for. Its bar fill, its sweeping sheen, and the way
it reserves room come from `styles/_skeleton.scss`, which the button's busy state
draws from too. Its cells hold no text: each
carries a `data-skeleton-text` stand-in that the stylesheet draws invisibly, so the
table's own `max-content` sizing gives the wireframe a real table's measurements at
any font size, and no placeholder reaches the page's text. No stand-in for a value
wraps, because no real value does either, so a wireframe row is one line tall like
a real one. Its header wraps on its own, with a floor of two lines so it still
reads as a header where a real heading fits on one.

Passes `ariaBusy` and `ariaHidden` to `TableShell`, so a screen reader skips the
wireframe entirely rather than reading ~1500 empty cells, and reads a
`role="status"` sibling span (`Loading picks results` / `Loading scoreboard
results`) instead.

## Subdirectories

- [`picks/`](picks/CLAUDE.md) — picks table, per-pick toasts
- [`playerName/`](playerName/CLAUDE.md) — name cell, shared status icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, default view

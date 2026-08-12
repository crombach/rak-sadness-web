# picks

`PicksTable`: college/pro pick grid with a per-pick explanation toast on click.
Renders `PlayerName` per row, whose own click opens the player analysis instead,
headers via `rangeWithPrefix` (C1..., P1...), uses `ToastContext`.

Each pick cell is a `PickCell`, the shared `.table__cell-button` inside the `<td>`
that carries the status fill. Right, wrong, and unscoreable picks (`--yes`, `--no`,
`--unscoreable`) each get a `PICK_STATUS_LABEL` entry rendered as a `.table__sr-only`
span, so a screen reader gets the outcome the cell's color otherwise carries alone.
`incomplete` has no entry: it draws no color of its own either, so there is nothing
sighted for a screen reader to catch up on.

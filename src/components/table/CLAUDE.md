# table

`TableShell`: the frame both results tables share, plus the trailing row that keeps
the last real row clear of a phone's rounded corners. `Table.scss` sizes that row
from `env(safe-area-inset-bottom)`, so it has no height on a screen without an
inset, and holds the shared `.table` styles (sticky header and player column,
pick status colors, striped rows).

## Subdirectories

- [`explanation/`](explanation/CLAUDE.md) — explanation-view table with pick toasts
- [`playerName/`](playerName/CLAUDE.md) — player name cell with knocked-out icon
- [`scores/`](scores/CLAUDE.md) — ranked score table, the default results view

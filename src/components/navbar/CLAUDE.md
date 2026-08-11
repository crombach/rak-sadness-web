# navbar

`Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
Owns the padding and the phone-sized touch target of every button it contains,
trading its own padding for theirs on a narrow screen.
`ScoresNavbar`: the scoreboard/picks switch plus the refresh button, for the
results routes. `canRefresh` drops the refresh button and its divider once the
week is decided, since rescoring cannot change a finished week.

## Subdirectories

- [`LogoButton/`](LogoButton/CLAUDE.md) — logo button, navbar left

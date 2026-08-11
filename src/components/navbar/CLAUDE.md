# navbar

`Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
Owns the padding and the phone-sized touch target of every button it contains,
trading its own padding for theirs on a narrow screen.
`ScoresNavbar`: the scoreboard/picks switch plus the refresh button, for the
results routes. Clearing `canRefresh` collapses the refresh button and its divider,
since rescoring cannot change a finished week. They fade and narrow out over
`COLLAPSE_DURATION_MS`, then unmount, and cancel `Navbar`'s `--navbar-gap` with a
negative margin so no gap is left where they were.

## Subdirectories

- [`LogoButton/`](LogoButton/CLAUDE.md) — logo button, navbar left

# navbar

`Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
Owns the padding and the phone-sized touch target of every button it contains,
trading its own padding for theirs on a narrow screen.
`ScoresNavbar`: the scoreboard/picks switch plus the refresh a week still being
played gets, for the results routes. Clearing `isWeekLive` collapses the refresh
button and the divider before it, since rescoring cannot change a finished week.
They share one collapsing wrapper, fade and narrow out over
`COLLAPSE_DURATION_MS`, then unmount, and cancel `Navbar`'s `--navbar-gap` with a
negative margin so no gap is left where they were.

Nothing here opens the player analysis. A player's name does, in either table, on
a finished week as well as a live one.

## Subdirectories

- [`LogoButton/`](LogoButton/CLAUDE.md) — logo button, navbar left

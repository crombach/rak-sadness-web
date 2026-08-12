# navbar

`Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
Owns the padding and the phone-sized touch target of every button it contains,
trading its own padding for theirs on a narrow screen.
`ScoresNavbar`: the scoreboard/picks switch plus the buttons a week still being
played gets, for the results routes. Clearing `isWeekLive` collapses the refresh
button, the gold player analysis button, and the divider before them, since
rescoring cannot change a finished week and nobody has a route left to work out.
A player's name still opens the analysis on a finished week, where it reads as the
week's result. They share one collapsing wrapper, fade and narrow out over
`COLLAPSE_DURATION_MS`, then unmount, and cancel `Navbar`'s `--navbar-gap` with a
negative margin so no gap is left where they were.

The analysis button carries `EmojiEventsIcon`, the same trophy `PlayerStatusIcon`
crowns a winner with. They never share a screen except during that collapse, since
one is for a week still being played and the other for a week that is over.

## Subdirectories

- [`LogoButton/`](LogoButton/CLAUDE.md) — logo button, navbar left

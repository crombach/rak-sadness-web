# navbar

- `Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
  Owns the padding and the phone-sized touch target of every button it contains.
- `ScoresNavbar`: the scoreboard/picks switch plus the refresh a week still being
  played gets, for the results routes. Clearing `isWeekLive` collapses the refresh
  button and the divider before it.
- `LogoButton`: the logo and `APP_NAME`, which it exports, as one target. Used by
  the home page and the results frame as well as here. The name is set in
  `--rak-font-display`, a 14-segment face, over a dim row of its all-on
  character.

Nothing here opens the player analysis. A player's name does, in either table, on a
finished week as well as a live one.

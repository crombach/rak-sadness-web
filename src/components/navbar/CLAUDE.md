# navbar

- `Navbar`: `<header>` with `left`/`right` `ReactNode` slots, solid primary fill.
  Owns the padding and the phone-sized touch target of every button it contains.
- `ScoresNavbar`: the scoreboard/picks switch plus the refresh a week still being
  played gets, for the results routes. Clearing `isWeekLive` collapses the refresh
  button and the divider before it.
- `LogoButton`: `APP_NAME`, which it exports, as a target that goes home. The
  results frame and the home page use it too. The name is set in
  `--rak-font-display` over a dim row of its all-on character, sunk into a well.

Nothing here opens the player analysis. A player's name does, in either table, on a
finished week as well as a live one.

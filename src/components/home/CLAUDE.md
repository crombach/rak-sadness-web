# home

`HomePage`: the `/` route. Season select above the week select, hidden picks file
input behind a button, View Results (navigates to the week's scoreboard), Export
Results, and the footer.
`HomePage.scss` carries the season and week selects' whole look, since Base UI
ships them unstyled. Both share the same `.select__*` classes.

This is the one page that keeps working on a phone held sideways, and says so with
`allowLandscape` on `PageLayout`. The stack is taller than that screen, so it
splits into two columns there: the selects beside the buttons, footer links
dropped. `home__pickers` and `home__actions` are what make each a column, and they
are `display: contents` everywhere else, so the stack the rest of the app sees is
untouched.

# context

`AppDataContext`: the season list, week list, picks, and scores, held above the
routes. Derives the season and week from the pathname on every render.
`selectableSeasons` is the seasons with picks plus the one running now, which is
offered whether or not it has any: its weeks are scored from a spreadsheet the user
uploads until its picks reach the database. It still opens on the newest season with
picks, since ESPN calls a season current as soon as the last one ends. Publishes
`WeekDecidedContext` separately, so a table cell reading it does not re-render on
every loading flag.

`ToastContext`: splits the toast list from its actions, for the same reason.

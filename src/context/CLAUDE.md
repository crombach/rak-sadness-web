# context

`AppDataContext`: the season list, week list, picks, and scores, held above the
routes. Derives the season and week from the pathname on every render. Publishes
`WeekDecidedContext` separately, so a table cell reading it does not re-render on
every loading flag.

`ToastContext`: splits the toast list from its actions, for the same reason.

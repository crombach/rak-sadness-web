# context

- `AppDataContext`: the season list, week list, picks, and scores, held above the
  routes, with the season and week derived from the pathname. Publishes
  `WeekDecidedContext` separately.
- `ToastContext`: the toast list, split from its actions.
- `PlayerAnalysisContext`: how a player's name in a table opens the player analysis
  on them. One callback, a no-op with no provider above.

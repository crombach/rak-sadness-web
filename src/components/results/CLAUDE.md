# results

The `/:season/:week` routes, plus `CurrentWeekRedirect`, which backs `/scoreboard`
and `/picks` by redirecting to the latest week worth showing.

- `ResultsLayout`: the layout route. Runs `useWeekRouteGuard`, keeps the URL and the
  selected week in step, and holds the navbar.
- `ScoreboardRoute` and `PicksRoute`: one table each, from context.
- `ResultsFrame`: the page and wireframe both `ResultsLayout` and
  `CurrentWeekRedirect` render into. Holds the app's `PlayerAnalysisDialog` and
  `GameStatusDialog` and both providers around the tables, and reads
  `useIsWeekDecided` for `ScoresNavbar`'s `isWeekLive`. What the tables opened is one
  piece of state, so two dialogs cannot both be up claiming the viewport insets.
- `ResultsFrame.scss`: the column the table and the wireframe are laid in, and the
  caption naming the week over both.

# results

The `/week/:week` routes. `ResultsLayout` is the layout route: it runs
`useWeekRouteGuard`, keeps the URL and the selected week in step, and holds the
navbar so switching views does not restart the refresh throttle.
`ScoreboardRoute` and `ExplanationRoute` each render one table from context. Until
the guard says the week is ready, the layout shows `SkeletonTable` instead, and
`ResultsLayout.scss` colors the scores area so the gap below it reads as part of the
table.

# results

The `/:season/:week` routes, plus `CurrentWeekRedirect`, which backs `/scoreboard`
and `/picks` by redirecting to the latest week worth showing. `ResultsLayout` is
the layout route: it runs `useWeekRouteGuard`, keeps the URL and the selected week
in step, and holds the navbar so switching views does not restart the refresh
throttle. `ScoreboardRoute` and `PicksRoute` each render one table from context.
`ResultsFrame` is the page and wireframe both `ResultsLayout` and
`CurrentWeekRedirect` render into, and `ResultsFrame.scss` colors the scores area
so the gap below it reads as part of the table. It reads `useIsWeekDecided` to
pass `ScoresNavbar` its `isWeekLive` prop, and holds the one `PathToVictoryDialog`
the app has, opened from that navbar and fed the `scores` `ResultsLayout` passes
down. One dialog toggled rather than one mounted per opening, because Base UI ties
its scroll lock and focus guards to a dialog being open.

# playerAnalysis

Where a player stands in a week and what they must still do to win it, opened from
their name in either table.

- `PlayerAnalysisDialog`: `DialogShell` over a `DialogCombobox`. `playersMatching`
  offers every player the typed letters reach; entries and input carry
  `PlayerStatusIcon`. `useArrival` takes a name handed in from a table.
- `PlayerAnalysisDialog.scss`: the status hues alone. Everything else about the look
  comes from `components/dialog/`.
- `AnalysisSummary`: renders `PlayerAnalysis`: the pick grid, the routes, the
  `MNF Points` section. Decides once whether the week is done, for both halves.
- `Standing`: where the picked player stands, read off the scores, so it shows
  while their routes are worked out.

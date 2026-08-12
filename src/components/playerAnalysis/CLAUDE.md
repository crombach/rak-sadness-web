# playerAnalysis

Where a player stands in a week and what they must still do to win it, opened from
their name in either table.

- `PlayerAnalysisDialog`: a Base UI dialog over a Base UI combobox.
  `playersMatching` offers every player the typed letters reach; entries and input
  carry `PlayerStatusIcon`.
- `PlayerAnalysisDialog.scss`: a bottom sheet, a centered modal at `wide-screen`.
  Popup list and focus ring from `styles/`. Sized against `useViewportInsets`, so
  the search's keyboard cannot cover it.
- `AnalysisSummary`: renders `PlayerAnalysis`: the pick grid, the routes, the
  `MNF Points` section. Decides once whether the week is done, for both halves.
- `Standing`: where the picked player stands, read off the scores, so it shows
  while their routes are worked out.

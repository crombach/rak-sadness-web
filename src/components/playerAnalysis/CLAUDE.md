# playerAnalysis

Where a player stands in a week and what they still have to do to win it, opened
from a player's name in either table.

- `PlayerAnalysisDialog`: a Base UI dialog over a Base UI combobox, with
  `AnalysisSummary` under it. `playersMatching` offers every player the typed
  letters reach, and both the entries and the input carry `PlayerStatusIcon`.
- `PlayerAnalysisDialog.scss`: a bottom sheet, stood up as a centered modal at
  `wide-screen`. Popup list from `styles/_listbox.scss`, focus ring from
  `styles/_focus.scss`. Sized and stood against `useViewportInsets`, so the
  keyboard the search opens does not cover it.
- `AnalysisSummary`: renders `PlayerAnalysis`. Holds `Standing`, the pick grid, the
  routes, and the `MNF Points` section.

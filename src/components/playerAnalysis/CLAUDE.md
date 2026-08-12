# playerAnalysis

Where a player stands in a week and what they still have to do to win it, opened
from the navbar's gold trophy button or from a player's name in either table.

`PlayerAnalysisDialog`: a Base UI dialog over a Base UI combobox, with
`AnalysisSummary` under it. `playersMatching` offers every player the letters typed
reach, knocked out or not, since a knocked out one has an answer too. An entry
carries the status icon the tables give the same player, through
`PlayerStatusIcon`, drawn in `--rak-in-contention-text` or `--rak-knocked-out-text`.
The icon says the status rather than a fill behind it, so the only fill in the popup
is still the highlight the list draws as it is walked. A name too long for the popup
is cut short rather than wrapped, so an entry stays one line. The search is thousands
of scenarios, so it runs on the player chosen rather than on every render. Only the
search holds still: everything under the rule below it scrolls. A `player` prop
stands in for a choice made in the search, and remounts the combobox so the name
reaches its input. `PlayerAnalysisDialog.scss` centers the one dialog as a modal and
stands it on the bottom edge as a sheet below `compact-screen`, replacing both ends
of the transition, since a sheet cannot inherit a centered transform. Its popup list
takes its shape from `styles/_listbox.scss`, which the home page selects share.

`AnalysisSummary`: renders `PlayerAnalysis`, working out only what it takes to say
it. The standing leads, from `Standing`, which reads the scores rather than the
search, and names no leader until a pick is settled. Picks sit in a
grid rather than a wrapping row, so the same game holds the same column down every
route. A must-win game carries a red line where a route carries gold. Routes stand
four deep and unfold on a click, and the dialog's own key on the player is what
starts a new one folded. A closing note counts the routes found past the ten kept.
A player picked always reads a sentence, down to the week resting on the
tiebreaker alone.

A tiebreaker every route shares is stated once under `MNF points`, and left off
the routes themselves. Where they disagree each route carries its own, and that
section does not render.

One suite here mounts one dialog, on purpose. Base UI leaves its scroll lock, focus
guards, and inert markers on the document when a second one mounts, which puts the
input of every other case out of reach. The app holds one dialog and toggles `open`.

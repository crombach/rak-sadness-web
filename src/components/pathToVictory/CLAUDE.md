# pathToVictory

What a player still has to do to win a week that is being played, opened from the
navbar's gold trophy button.

`PathToVictoryDialog`: a Base UI dialog holding a Base UI combobox over
`eligiblePlayers`, and `VictorySummary` under it. Only the players who can still win
are offered, since a knocked out one has no route to show. The search behind it is
thousands of scenarios, so it runs on the player chosen rather than on every render
around them. One dialog serves both shapes: `PathToVictoryDialog.scss` centers it as a modal and
stands it on the bottom edge as a sheet below `compact-screen`, replacing both ends
of the transition rather than the resting rule, since the sheet cannot inherit a
centered transform. State comes off Base UI's `[data-open]`, `[data-starting-style]`,
and `[data-highlighted]`, the same way the home page's select is styled.

`VictorySummary`: the must-win games, the pool the rest come from, the games out of
the player's hands, and the Monday night sentence, plus the eliminated, clinched,
and too-many-games states. Must-win leads, and how the player stands closes, since
the games to back are what the sheet is opened for. A list of routes stands five
deep and unfolds on a click, keyed on the player so a new one starts folded again.
It renders `PathsToVictory` and works nothing out itself, which is why every case it
can show is testable without a dialog around it.

One suite here mounts one dialog, on purpose. Base UI hangs its scroll lock, focus
guards, and inert markers off the document while a dialog is open, and mounting a
second one leaves the previous set behind, so every other case in a file that mounts
several types into an input those leftovers have put out of reach. The app never
does this: `ResultsFrame` holds one dialog and toggles `open` on it.

# pathToVictory

What a player still has to do to win a week being played, opened from the navbar's
gold trophy button.

`PathToVictoryDialog`: a Base UI dialog over a Base UI combobox, with
`VictorySummary` under it. `playersMatching` holds a knocked out player back while
anyone still standing shares the letters typed, and offers them disabled in danger
red with a skull when they are the only match. The search is thousands of scenarios,
so it runs on the player chosen rather than on every render. `PathToVictoryDialog.scss`
centers the one dialog as a modal and stands it on the bottom edge as a sheet below
`compact-screen`, replacing both ends of the transition, since a sheet cannot inherit
a centered transform.

`VictorySummary`: renders `PathsToVictory` and works nothing out itself. Must-win
leads and the standing line closes. Routes stand five deep and unfold on a click,
keyed on the player so a new one starts folded.

One suite here mounts one dialog, on purpose. Base UI leaves its scroll lock, focus
guards, and inert markers on the document when a second one mounts, which puts the
input of every other case out of reach. The app holds one dialog and toggles `open`.

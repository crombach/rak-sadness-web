# playerAnalysis

Where a player stands in a week and what they still have to do to win it, opened
from a player's name in either table.

`PlayerAnalysisDialog`: a Base UI dialog over a Base UI combobox, with
`AnalysisSummary` under it. `playersMatching` offers every player the letters typed
reach, knocked out or not, since a knocked out one has an answer too. An entry
carries the status icon the tables give the same player, through
`PlayerStatusIcon`, drawn in `--rak-in-contention-text` or `--rak-knocked-out-text`.
The icon says the status rather than a fill behind it, so the only fill in the popup
is still the highlight the list draws as it is walked. A name too long for the popup
is cut short rather than wrapped, so an entry stays one line. The search is thousands
of scenarios, so it runs on the player chosen rather than on every render. The answer
already on screen stays there while the next one is worked out, under a bar on the
rule that says so, rather than being taken away and put back. Only the
search holds still: everything under the rule below it scrolls. A `player` prop
stands in for a choice made in the search, and remounts the combobox so the name
reaches its input. `PlayerAnalysisDialog.scss` stands the one dialog on the bottom
edge as a sheet, and stands it up as a centered modal at `wide-screen`, replacing
both ends of the transition, since a window cannot inherit a sheet's slide. The
answer's scrollbar gutter is held whether or not there is a scrollbar, so a long
answer replacing a short one does not narrow the text. The list's empty message is
a live region Base UI keeps mounted, so its padding is dropped while it is empty
rather than standing over the first name. The search marks the player named in it with the icon the tables give them, right
of the input, so it says where they stand before the answer has been worked out.
Its popup list
takes its shape from `styles/_listbox.scss`, which the home page selects share.

`AnalysisSummary`: renders `PlayerAnalysis`, working out only what it takes to say
it. The standing leads, from `Standing`, which reads the scores rather than the
search, and says no game has been played until a pick is settled. It answers for
the player picked and for nobody else: the dialog is opened on a name and holds one
from then on, so clearing the search filters the list rather than taking the answer
away. With nothing left to play it
reads as a result rather than a standing: the player picked is the
winner rather than tied for the lead, and the tail says the week is complete
instead of counting no games. Who won is settled on merit rather than on points,
through `comparePlayerScoresOnMerit`, so two players level on points that the
tiebreakers separate leave one winner rather than a tie. Points alone still say who
leads a week still being played, since the tiebreakers are not settled yet. A week whose games are all played but not all
scoreable says so rather than reading as complete, since a leader on a total the
app could not work out is not a winner yet. `Standing` also takes the analysis once it lands,
read only for a clinch: a clinched player is called the winner outright even with
games left, so the body underneath only names the week they won and, where games
remain, says nothing left to play can undo it. Trusted only where the analysis answers for the player named,
since the dialog keeps the last one on screen while the next is worked out.
Nothing an `eliminated` or `headline` result says repeats the header either: a
player already called `Knocked out` there is left to the explanation below, and
one still trailing keeps the pick count the `headline` kind answers with, since
that counts only the player's own remaining picks and can differ from the
header's count of every game left. Picks sit in a
grid rather than a wrapping row, so the same game holds the same column down every
route, and a pick is drawn monospace and given the width of the widest team
abbreviation and spread a sheet can hold, so a column fits as many as it can and
never cuts one short. A must-win game carries a red line where a route carries gold.
Routes stand four deep and unfold on a click, and the dialog's own key on the player
is what starts a new one folded. Under the last one opened, a note counts the routes
found past the eight kept, held back until the rest have been asked for.
A player picked always reads a sentence, down to the week resting on the
tiebreaker alone.

A tiebreaker every route shares is stated once under `MNF Points`, as a sentence,
and left off the routes themselves. Where they disagree each route carries its own
and that section does not render. A route says it the way it says its picks: set
monospace under them, with `AND`, `TO BEAT`, and the commas between the players in
the grey a pick's label carries. The total and the players it beats wrap as wholes,
so a narrow screen breaks between them.

One suite here mounts one dialog, on purpose. Base UI leaves its scroll lock, focus
guards, and inert markers on the document when a second one mounts, which puts the
input of every other case out of reach. The app holds one dialog and toggles `open`.

# playerName

`PlayerName`: table cell (`<td>`), holding a `.table__cell-button` with the player
name and status icon. Click opens the player analysis on that player, through
`PlayerAnalysisContext`. The `<td>` keeps the fill and the `--knocked-out` class,
since `--rak-cell-fill` has to live on the cell the stripe rule reads it back from;
the button just fills that cell edge to edge.
Name never wraps: cut short with an ellipsis past 18 characters, which the cell's
monospace font makes exactly `18ch`. So every row is one line tall.

A `.table__sr-only` span carries "Knocked out" or "Still in contention", the words
for the fill color (`--rak-in-contention-300`/`--rak-knocked-out-300`) that a
sighted reader gets instead.

`PlayerStatusIcon`: that icon on its own (`Skull`, or `EmojiEvents` once the week is
decided and `SentimentVerySatisfied` before it), sized from `--rak-player-icon-size`.
The player analysis search names the same players, so it renders this rather than
choosing an icon of its own. Black on the table's own fills; a caller with no fill
behind it sets `--rak-player-icon-fill` to say the status in the icon instead.

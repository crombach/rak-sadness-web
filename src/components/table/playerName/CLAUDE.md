# playerName

`PlayerName`: table cell (`<td>`), player name + status icon. Click opens the player
analysis on that player, through `PlayerAnalysisContext`.
Name never wraps: cut short with an ellipsis past 20 characters, which the cell's
monospace font makes exactly `20ch`. So every row is one line tall.

`PlayerStatusIcon`: that icon on its own (`Skull`, or `EmojiEvents` once the week is
decided and `SentimentVerySatisfied` before it), sized from `--rak-player-icon-size`.
The player analysis search names the same players, so it renders this rather than
choosing an icon of its own.

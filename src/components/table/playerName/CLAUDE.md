# playerName

`PlayerName`: table cell (`<td>`), player name + knocked-out status icon (`SentimentVeryDissatisfied`/`SentimentVerySatisfied`).
Click shows status explanation via `ToastContext`.
Name never wraps: cut short with an ellipsis past 20 characters, which the cell's
monospace font makes exactly `20ch`. So every row is one line tall.

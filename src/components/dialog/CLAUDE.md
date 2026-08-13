# dialog

The dialog the player analysis and the game status are shown in, and the search each
is pointed with.

- `DialogShell`: `Dialog.Root` down to the scrolling body. Takes a `search` holding
  still above the body's hairline rule, and `busy` for the bar drawn there.
- `DialogShell.scss`: a bottom sheet, a centered modal at `wide-screen`, sized against
  `useViewportInsets` so a keyboard covers nothing and the sheet still reaches the
  bottom edge. `--rak-dialog-inset` stands the bar on the rule.
- `DialogCombobox`: the controlled combobox, generic over its option, the caller holding
  the choice and the query. Its list opens under the search, never over it. Choosing
  hands the focus to the dialog, which drops a phone's keyboard.

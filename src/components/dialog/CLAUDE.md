# dialog

The dialog the player analysis and the game status are shown in, and the search each
is pointed with. Base UI ships both unstyled, so these stylesheets carry the look.

- `DialogShell`: `Dialog.Root` down to the scrolling body. Takes a `search` holding
  still above the body's hairline rule, and `busy` for the bar drawn there.
- `DialogShell.scss`: a bottom sheet, a centered modal at `wide-screen`. Sized and
  padded against `useViewportInsets`, so a keyboard covers nothing and the sheet still
  reaches the bottom edge. `--rak-dialog-inset` is what the bar sits on that rule by.
- `DialogCombobox`: the controlled combobox, generic over its option. The caller holds
  the choice and the query, so a subject from outside needs no rebuild.

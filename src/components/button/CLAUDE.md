# button

`Button`: the app's only button, icon-only buttons included. Wraps Base UI's
unstyled `Button` and adds the `--solid`/`--soft` variants,
`--primary`/`--success`/`--danger` colors, `--sm`, and `--icon`.

Every color rule is scoped to `:not(:disabled)`. The variant selectors are more
specific than `&:disabled`, so without that scoping a disabled button keeps its
solid fill.

`buttonRef` forwards to the underlying element. `RakSadness` uses it to toggle a
spin class on the refresh button.

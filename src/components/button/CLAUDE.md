# button

`Button`: the app's only button, icon-only buttons included. Wraps Base UI's
unstyled `Button` and adds the `--solid`/`--soft` variants,
`--primary`/`--success`/`--danger` colors, `--sm`, and `--icon`.

Every color rule is scoped to `:not(:disabled)`. The variant selectors are more
specific than `&:disabled`, so without that scoping a disabled button keeps its
solid fill.

`ariaLabel` sets the accessible name, required of a button whose content is an
icon alone.

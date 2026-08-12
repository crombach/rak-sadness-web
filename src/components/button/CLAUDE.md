# button

`Button`: the app's only button, icon-only buttons included. Wraps Base UI's unstyled
`Button` and adds the `--solid`/`--soft` variants, the
`--primary`/`--success`/`--danger` colors, `--sm`, `--icon`, and `--compact`. Every
prop is documented on the component itself.

`selected` says which one of a set is chosen with a rule on the button's bottom edge,
because a fill one step from its neighbours' cannot be told apart. Solid primary
darkens a step as well, having the room for it.

Every color rule is scoped to `:not(:disabled)`. The variant selectors are more
specific than `&:disabled`, so without that scoping a disabled button keeps its solid
fill. Every `:hover` sits behind `can-hover`, because touch reports a hover on the
last thing tapped and holds it there, which reads as a selection the app does not
have. `busy` draws the sheen from `styles/_skeleton.scss`, the same one the wireframe
tables sweep with.

# button

`Button`: the app's only button, icon-only buttons included. Wraps Base UI's unstyled
`Button` and adds the `--solid`/`--soft` variants, the
`--primary`/`--success`/`--danger` colors, the `--lg`/`--sm` sizes, `--icon`, and
`--compact`, which is tighter side padding for a bar holding more buttons than room.

`selected` marks which one of a set is chosen. It emits `aria-pressed` as well as the
class, and says so with a rule on the button's bottom edge rather than a fill one step
from its neighbours', which a fill alone could not tell apart.

`ariaDisabled` is unavailable for now rather than unavailable outright: it keeps the
button in the tab order and looking like itself, and swallows the click. `disabled`
does none of that, so it is wrong for a control that is only waiting on something.
`busy` draws the shared loading sheen and sets `aria-busy`.

Every color rule is scoped to `:not(:disabled)`. The variant selectors are more
specific than `&:disabled`, so without that scoping a disabled button keeps its solid
fill. Every `:hover` sits behind `can-hover`, because touch reports a hover on the
last thing tapped and holds it there, which reads as a selection the app does not
have.

`ariaLabel` sets the accessible name, required of a button whose content is an icon
alone. `ariaExpanded` and `ariaControls` go together, for a button that opens
something below it.

# styles

Sass partials, mixins and variables only, so a partial emits no CSS however many
files `@use` it. `_skeleton.scss` is the one exception, and says so: it holds
keyframes. Design tokens live in `src/index.scss` instead.

- `_breakpoints.scss`: `roomy-screen`, `labelled-navbar`, `wide-screen`,
  `can-hover`, `phone-landscape`, `reduced-motion`
- `_focus.scss`: `focus-ring`, the app's one focus ring
- `_a11y.scss`: `visually-hidden`
- `_field.scss`: `field-shell` and `field-icon`, the home page selects' box
- `_listbox.scss`: `listbox-popup` and `listbox-item`, the shape of a Base UI popup
  list, shared by the home page selects and the dialogs' combobox
- `_skeleton.scss`: `skeleton-surface`, `skeleton-sheen`, `skeleton-reserve`

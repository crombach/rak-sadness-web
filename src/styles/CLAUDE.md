# styles

Sass partials. Mixins and variables only, so a partial emits no CSS however many
files `@use` it. `_skeleton.scss` is the one exception, and says so: it holds
keyframes, which a Sass module writes out once however many callers there are.
Design tokens live in `src/index.scss` instead.

`_breakpoints.scss`: every mixin is `min-width`. A phone gets the base rules and a
wider screen opts into what the room allows, so the floor a finger needs is the
default rather than the exception. `roomy-screen` loosens the tables and the navbar,
`labelled-navbar` is room enough to label the navbar's buttons, `wide-screen` is room
enough to center a dialog rather than stand it on the bottom edge as a sheet, and
`can-hover` guards a hover fill, which touch would otherwise leave stuck on the last
thing tapped. `phone-landscape` is the one that is not about width: a phone on its
side, told apart from a tablet by being under 500px tall, which `PageLayout` covers
with a note asking for the phone back upright. These have to be Sass, because custom
properties do not work inside a media query.

`_focus.scss`: `focus-ring`, the one focus ring in the app. It takes the state that
draws it, `:focus-visible` by default, so a shell around a control can ask for
`:focus-within` and still draw the same ring.
`_a11y.scss`: `visually-hidden`, for text only a screen reader reads.
`_field.scss`: `field-shell` and `field-icon`, the box the home page's two selects
share. The analysis dialog's search is not one of them: it sits inside a popup and is
shorter than a page-level control, so it keeps its own box.
`_listbox.scss`: `listbox-popup` and `listbox-item`, the shape the selects and that
search give a Base UI popup list. Each caller adds what makes its own list different.
`_skeleton.scss`: `skeleton-surface`, `skeleton-sheen`, and `skeleton-reserve`, the
one way the app says it is still working. A wireframe stands in for content that is
not there yet, and a sheen crosses content that is there but stale. Nothing spins.
`SkeletonTable.scss` takes all three and `Button.scss` takes the sheen, so the sweep
is written down once.

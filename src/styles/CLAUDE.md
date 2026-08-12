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

`_focus.scss`: `focus-ring`, the one focus ring in the app.
`_a11y.scss`: `visually-hidden`, for text only a screen reader reads.
`_field.scss`: `field-shell` and `field-icon`, the shell every control the user types
into or opens shares, which is the home page's selects and the player search.
`_listbox.scss`: `listbox-popup` and `listbox-item`, the shape those same two give a
Base UI popup list. Each caller adds what makes its own list different.
`_skeleton.scss`: `skeleton-surface`, `skeleton-sheen`, and `skeleton-reserve`, the
one way the app says it is still working. A wireframe stands in for content that is
not there yet, and a sheen crosses content that is there but stale. Nothing spins.

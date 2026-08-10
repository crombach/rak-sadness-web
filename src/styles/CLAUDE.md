# styles

Sass partials, no CSS of their own. `_breakpoints.scss` holds the narrow-screen
width and mixin, which have to be Sass because custom properties do not work
inside a media query. Design tokens live in `src/index.scss` instead.

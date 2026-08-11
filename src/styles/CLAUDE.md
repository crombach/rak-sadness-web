# styles

Sass partials, no CSS of their own. `_breakpoints.scss` holds two mixins,
`narrow-screen` (phone-width tables and navbar) and `crowded-navbar` (too little
room for the navbar to label its buttons), which have to be Sass because custom
properties do not work inside a media query. Design tokens live in
`src/index.scss` instead.

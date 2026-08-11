# styles

Sass partials, no CSS of their own. `_breakpoints.scss` holds three mixins,
`narrow-screen` (phone-width tables and navbar), `crowded-navbar` (too little
room for the navbar to label its buttons), and `compact-screen` (too little room to
center a dialog, so it rises from the bottom edge as a sheet), which have to be Sass
because custom properties do not work inside a media query. Design tokens live in
`src/index.scss` instead.

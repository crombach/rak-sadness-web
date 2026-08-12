# icon

Every icon the app draws, as one `<svg>` each. Path data copied verbatim from
`@mui/icons-material` (Material Design icons, Apache 2.0), inlined because those
components drag `@mui/material` and emotion in behind them. `Icon.scss` holds the
24px box, which `PlayerStatusIcon.scss` overrides down to 16px.

Each icon carries the `data-testid` its MUI counterpart had, which is how the
toaster suite finds them.

`SkullIcon` comes from Material Symbols, which `@mui/icons-material` does not
carry. Same icon family and licence, drawn on a `0 -960 960 960` box, which is why
`Icon` takes a `viewBox`.

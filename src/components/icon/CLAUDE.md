# icon

Every icon the app draws, as one `<svg>` each. Path data copied verbatim from
`@mui/icons-material` (Material Design icons, Apache 2.0), inlined because those
components drag `@mui/material` and emotion in behind them. `Icon.scss` holds the
24px box, which `PlayerStatusIcon.scss` overrides down to 16px.

Each icon carries the `data-testid` its MUI counterpart had, which is how the
toaster suite finds them.

`SkullIcon` comes from Material Symbols (filled style), which `@mui/icons-material`
does not carry. Same licence, its path data rescaled from Symbols' `0 -960 960 960`
box onto the standard 24px one so it sits on the same grid as every other icon
here.

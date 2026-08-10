# icon

Every icon the app draws, as one `<svg>` each. Path data copied verbatim from
`@mui/icons-material` (Material Design icons, Apache 2.0), inlined because those
components drag `@mui/material` and emotion in behind them. `Icon.scss` holds the
24px box, which `PlayerName.scss` overrides down to 16px.

Each icon carries the `data-testid` its MUI counterpart had, which is how the
toaster suite finds them.

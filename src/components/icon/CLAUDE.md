# icon

Every icon the app draws, as one `<svg>` each. Path data copied verbatim from
`@mui/icons-material` (Material Design icons, Apache 2.0), inlined because those
components drag `@mui/material` and emotion in behind them. `SkullIcon` comes from
Material Symbols instead, same licence, rescaled onto the 24px grid.

`Icon.scss` holds the 24px box. A caller wanting another size overrides
`width`/`height` from an `--rak-icon-*` token.

Each icon keeps the `data-testid` its MUI counterpart had, which is how the toaster
suite finds them.

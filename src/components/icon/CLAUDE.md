# icon

Every icon the app draws, as one `<svg>` each. Path data copied verbatim from
`@mui/icons-material` (Material Design icons, Apache 2.0), inlined because those
components drag `@mui/material` and emotion in behind them. `Icon.scss` holds the
24px box. A caller wanting another size overrides `width`/`height` from an
`--rak-icon-*` token: `PlayerStatusIcon.scss` through `--rak-player-icon-size`, and
the note covering a phone on its side through `--rak-icon-lg`.

Each icon carries the `data-testid` its MUI counterpart had, which is how the
toaster suite finds them.

`SkullIcon` comes from Material Symbols, which `@mui/icons-material` does not
carry. Same licence, its path data rescaled from Symbols' `0 -960 960 960` box onto
the standard 24px one so it sits on the same grid as every other icon here.

`ScreenRotationIcon` is drawn nowhere but the note covering a phone held sideways,
where it leads the screen rather than sitting beside a word.

The app is drawn in filled icons, except the three a player's status wears:
`SkullOutlinedIcon`, `EmojiEventsOutlinedIcon`, and `SentimentVerySatisfiedIcon`,
which is only drawn as an outline. Those sit at the end of a line of text at 16px,
where a filled shape reads as a blot rather than as a skull or a trophy. The filled
`EmojiEventsIcon` is still what the footer's standings link carries.

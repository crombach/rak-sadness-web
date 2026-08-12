# LogoButton

Shared `Button` wrapping `logo192.png` and `APP_NAME`, which it exports, so the logo and the app name are one target. White 1px outline from an inline SVG `feMorphology` dilate filter, which strokes the logo's alpha channel evenly on every side. The filter's `id` comes from `useId`, so two logos on the same page never fight over one `url(#...)` reference.

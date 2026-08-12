# components

`PageLayout`: chrome every page shares, the background, the navbar, and `<main>`.
Its required `title` is the page's one `<h1>`, first inside `<main>` and drawn
nowhere. No route here shows a heading, so this is the only thing telling a screen
reader which page it landed on. It also holds the note that covers a phone turned
on its side, on every page: a week's table cannot be read across 400px of height,
so the app asks for the phone back the way round instead, under a `ScreenRotation`
icon saying the same thing in a shape.
Route components live in `home/` and `results/`;
the routes themselves are in `src/App.tsx`.

## Subdirectories

- [`button/`](button/CLAUDE.md) — shared button, Base UI's primitive
- [`footer/`](footer/CLAUDE.md) — bottom links bar
- [`home/`](home/CLAUDE.md) — home route: pickers, upload, export
- [`icon/`](icon/CLAUDE.md) — SVG icons inlined from Material Design
- [`navbar/`](navbar/CLAUDE.md) — top nav bar and view switch
- [`playerAnalysis/`](playerAnalysis/CLAUDE.md) — where a player stands, and why
- [`results/`](results/CLAUDE.md) — results routes, layout, redirect
- [`table/`](table/CLAUDE.md) — shared frame and the results tables
- [`toaster/`](toaster/CLAUDE.md) — toast notification renderer

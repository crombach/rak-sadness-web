# src

`index.tsx`: Vite entry, loaded by the root `index.html`. React 19 `createRoot` mount into `#root`, wraps `App` in `BrowserRouter`, `ToastContextProvider`, and `AppDataContextProvider`, with `Toaster` beside it. `App.tsx`: the route table, `/` plus `/:season/:week/scoreboard`, `/:season/:week/picks`, and `/scoreboard` and `/picks` redirecting to the latest week worth showing. `index.scss`: global resets, the body baseline, and every `--rak-*` design token. No theme provider: Base UI is unstyled, so tokens plus SCSS carry the whole look. `setupTests.ts`: Vitest setup, jest-dom plus a `jest` global shim that @testing-library/dom needs to drive fake timers.

## Subdirectories

- [`components/`](components/CLAUDE.md) — React UI, layout, routes
- [`context/`](context/CLAUDE.md) — app data and toast providers
- [`hooks/`](hooks/CLAUDE.md) — picks, scoring, export, route guard
- [`styles/`](styles/CLAUDE.md) — Sass mixins: two breakpoints
- [`types/`](types/CLAUDE.md) — ESPN, league, and scoring types
- [`utils/`](utils/CLAUDE.md) — scoring, ESPN, export, picks cache

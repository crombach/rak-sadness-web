# src

`index.tsx`: Vite entry, loaded by the root `index.html`. React 19 `createRoot` mount into `#root`, wraps `App` in `BrowserRouter`, `ToastContextProvider`, and `AppDataContextProvider`, with `Toaster` beside it. `App.tsx`: the route table, `/` plus `/week/:week/scoreboard` and `/week/:week/explanation`. `index.scss`: global resets, the body baseline, and every `--rak-*` design token. No theme provider: Base UI is unstyled, so tokens plus SCSS carry the whole look. `context/`: `ToastContext` (toast list and actions, split so senders do not re-render) and `AppDataContext` (the week list, picks, and scores, held above the routes). `setupTests.ts`: Vitest setup, jest-dom plus a `jest` global shim that @testing-library/dom needs to drive fake timers.

## Subdirectories

- [`components/`](components/CLAUDE.md) — React UI, page layout, route components
- [`hooks/`](hooks/CLAUDE.md) — week lookup, picks fetch and scoring, export, route guard
- [`styles/`](styles/CLAUDE.md) — Sass partials: the narrow-screen breakpoint
- [`types/`](types/CLAUDE.md) — ESPN, league, and scoring type declarations
- [`utils/`](utils/CLAUDE.md) — scoring, ESPN fetching, spreadsheet export, picks cache

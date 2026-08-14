# src

`index.tsx`: Vite entry, loaded by the root `index.html`. React 19 `createRoot` mount into `#root`, wraps `App` in `BrowserRouter`, `ToastContextProvider`, and `AppDataContextProvider`, with `Toaster` beside it. `App.tsx`: the route table, which the root `CLAUDE.md` lists. `index.scss`: global resets, the body baseline, every `--rak-*` design token, and
a `prefers-color-scheme: dark` override for the color ones. It
hides `<html>`'s overflow, because no route scrolls the page itself and saying so
keeps Base UI's scroll lock from reserving a scrollbar gutter that shifts everything
under an opening dialog. No theme provider: Base UI is unstyled, so tokens plus SCSS carry the whole look. `setupTests.ts`: Vitest setup, jest-dom plus a `jest` global shim that @testing-library/dom needs to drive fake timers.

## Subdirectories

- [`components/`](components/CLAUDE.md) — React UI, layout, routes
- [`context/`](context/CLAUDE.md) — app data, toast, and analysis providers
- [`hooks/`](hooks/CLAUDE.md) — picks, scoring, export, guard, measurement
- [`styles/`](styles/CLAUDE.md) — Sass mixins: breakpoints, listbox shape
- [`types/`](types/CLAUDE.md) — ESPN, league, and scoring types
- [`utils/`](utils/CLAUDE.md) — scoring, ESPN, export, picks cache

# src

`index.tsx`: Vite entry, loaded by the root `index.html`. React 19 `createRoot` mount into `#root`, wraps `RakSadness` + `Toaster` in `ToastContextProvider`. `index.scss`: global resets, the body baseline, and every `--rak-*` design token. No theme provider: Base UI is unstyled, so tokens plus SCSS carry the whole look. `context/ToastContext.tsx` (single file, no CLAUDE.md). `setupTests.ts`: Vitest setup, jest-dom plus a `jest` global shim that @testing-library/dom needs to drive fake timers.

## Subdirectories

- [`components/`](components/CLAUDE.md) — React UI, app root `RakSadness`
- [`hooks/`](hooks/CLAUDE.md) — week lookup, picks fetch and scoring, export
- [`types/`](types/CLAUDE.md) — ESPN, league, and scoring type declarations
- [`utils/`](utils/CLAUDE.md) — score computation, ESPN fetching, spreadsheet export

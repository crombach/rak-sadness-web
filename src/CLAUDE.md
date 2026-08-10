# src

`index.tsx`: React 18 `createRoot` mount into `#root`, wraps `RakSadness` + `Toaster` in MUI Joy `CssVarsProvider` and `ToastContextProvider`. `theme.ts`: Joy `extendTheme` light/dark primary palette. `index.scss`: global resets. `context/ToastContext.tsx` (single file, no CLAUDE.md).

## Subdirectories

- [`components/`](components/CLAUDE.md) — React UI, app root `RakSadness`
- [`types/`](types/CLAUDE.md) — ESPN, league, and scoring type declarations
- [`utils/`](utils/CLAUDE.md) — score computation, ESPN fetching, spreadsheet export

import "@testing-library/jest-dom";
import { vi } from "vitest";

// @testing-library/dom decides whether fake timers are installed by looking for
// a `jest` global, then advances the clock through it. Without this shim its
// waiting helpers schedule work on the faked clock and never resolve, so every
// interaction in a suite using vi.useFakeTimers times out. The inner check is
// on setTimeout itself, so this stays inert under real timers.
(globalThis as Record<string, unknown>).jest = {
  advanceTimersByTime: (ms: number): void => {
    vi.advanceTimersByTime(ms);
  },
};

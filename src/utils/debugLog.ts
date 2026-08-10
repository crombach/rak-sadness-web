// Vitest runs with DEV set, so checking DEV alone would keep the scoring path
// printing through every test run. Its mode is "test", which is the difference.
const IS_ENABLED = import.meta.env.DEV && import.meta.env.MODE !== "test";

/** Scoring traces, for stepping through a week by hand in the browser console. */
export default function debugLog(...args: Array<unknown>): void {
  if (IS_ENABLED) {
    console.debug(...args);
  }
}

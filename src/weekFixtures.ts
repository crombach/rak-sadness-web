import { WeekInfo } from "./types/League";

/**
 * The one `WeekInfo` builder every suite uses.
 *
 * Held apart from `appTestFixtures`, which mounts `App` and so cannot be imported
 * by a suite that mocks `react-router` or a context provider out from under it.
 */

/** The year the fixture season started in, which is what its dates say. */
export const SEASON = 2024;

export function week(value: number): WeekInfo {
  return {
    value,
    label: `Week ${value}`,
    startDate: new Date(SEASON, 8, value),
    endDate: new Date(SEASON, 8, value + 6),
  };
}

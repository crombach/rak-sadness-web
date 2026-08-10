import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";
import useLeagueWeeks from "../hooks/useLeagueWeeks";
import usePlayerScores from "../hooks/usePlayerScores";
import { WeekInfo } from "../types/League";

type AppData = ReturnType<typeof useLeagueWeeks> &
  ReturnType<typeof usePlayerScores> & {
    /**
     * The `WeekInfo` for a week number, or undefined if the season has no such
     * week. Always the calendar's own object: the week picker compares options by
     * reference, so a rebuilt one would leave it unable to show a selection.
     */
    findWeek: (value: number) => WeekInfo | undefined;
  };

const AppDataContext = createContext<AppData | undefined>(undefined);

function weekFromPath(pathname: string): number | undefined {
  const match = /^\/week\/(\d+)/.exec(pathname);
  return match != null ? Number(match[1]) : undefined;
}

/**
 * The week list, the picks, and the scores, held above the routes.
 *
 * Mounted here rather than inside a route so that navigating between the home
 * page and a week's results does not refetch the ESPN calendar or throw away an
 * uploaded workbook. Refetching would also mint a new week list, which would
 * break the week picker's reference comparison.
 */
export function AppDataContextProvider({
  children,
}: PropsWithChildren<object>) {
  // Read once: this is the week the visitor arrived asking for, not the week
  // they are looking at now.
  const { pathname } = useLocation();
  // State with no setter: the initial pathname, kept even as the route changes.
  const [arrivedAtWeek] = useState(() => weekFromPath(pathname));

  const leagueWeeks = useLeagueWeeks(arrivedAtWeek);
  const playerScores = usePlayerScores(leagueWeeks.selectedWeek);
  const { weeks } = leagueWeeks;

  const value = useMemo(
    () => ({
      ...leagueWeeks,
      ...playerScores,
      findWeek: (value: number) => weeks?.find((week) => week.value === value),
    }),
    [leagueWeeks, playerScores, weeks],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (value == null) {
    throw new Error("useAppData needs an AppDataContextProvider above it");
  }
  return value;
}

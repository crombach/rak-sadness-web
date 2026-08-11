import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";
import useLeagueWeeks from "../hooks/useLeagueWeeks";
import usePicksSeasons from "../hooks/usePicksSeasons";
import usePlayerScores from "../hooks/usePlayerScores";
import { WeekInfo } from "../types/League";
import isWeekDecided from "../utils/scoring/isWeekDecided";

type AppData = ReturnType<typeof useLeagueWeeks> &
  ReturnType<typeof usePlayerScores> &
  ReturnType<typeof usePicksSeasons> & {
    /**
     * The `WeekInfo` for a week number, or undefined if the season has no such
     * week. Always the calendar's own object: the week picker compares options by
     * reference, so a rebuilt one would leave it unable to show a selection.
     */
    findWeek: (value: number) => WeekInfo | undefined;
    /** Which season the user is looking at, by the year it started in. */
    setSelectedSeason: (season: number) => void;
    /**
     * The seasons that can be chosen, newest first. The ones with picks in the
     * database, or the season running now when that list cannot be had.
     */
    selectableSeasons: Array<number>;
  };

const AppDataContext = createContext<AppData | undefined>(undefined);

/**
 * Whether the week on screen is over, so whoever is left standing has won.
 *
 * Its own context rather than a field on `AppData`, because every player cell
 * reads it. On `AppData` they would each re-render on every loading flag the app
 * data carries, which is the same reason the toast list and its actions are
 * split. False with no provider above, so a table can still be rendered on its
 * own with scores handed straight to it.
 */
const WeekDecidedContext = createContext(false);

/** The season and week a results URL names, from `/<year>/<week>/…`. */
function routeFromPath(pathname: string): { season?: number; week?: number } {
  const match = /^\/(\d{4})\/(\d+)/.exec(pathname);
  return match != null
    ? { season: Number(match[1]), week: Number(match[2]) }
    : {};
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
  const { pathname } = useLocation();
  // State with no setter, so this stays the week the user arrived asking for
  // even once they are looking at another one.
  const [arrivedAt] = useState(() => routeFromPath(pathname));
  // Undefined until the user picks one, which is what asks ESPN for the season
  // running now. `seasonYear` then comes back saying which one that was.
  const [selectedSeason, setSelectedSeason] = useState(arrivedAt.season);

  const picksSeasons = usePicksSeasons();
  const leagueWeeks = useLeagueWeeks(arrivedAt.week, selectedSeason);
  const playerScores = usePlayerScores(
    leagueWeeks.selectedWeek,
    leagueWeeks.seasonYear,
  );
  const { weeks } = leagueWeeks;

  const findWeek = useCallback(
    (value: number) => weeks?.find((week) => week.value === value),
    [weeks],
  );

  const { scores } = playerScores;
  const weekDecided = useMemo(
    () => scores != null && isWeekDecided(scores),
    [scores],
  );

  // A season with no picks cannot be scored, so it is not offered. Falling back
  // to the season running now keeps the picker usable where the list could not be
  // fetched, which is every `make run`.
  const { seasonYear } = leagueWeeks;
  const selectableSeasons = useMemo(() => {
    const listed = picksSeasons.seasons ?? [];
    if (listed.length > 0) return listed;
    return seasonYear != null ? [seasonYear] : [];
  }, [picksSeasons.seasons, seasonYear]);

  const value = useMemo(
    () => ({
      ...leagueWeeks,
      ...playerScores,
      ...picksSeasons,
      findWeek,
      setSelectedSeason,
      selectableSeasons,
    }),
    [leagueWeeks, playerScores, picksSeasons, findWeek, selectableSeasons],
  );

  return (
    <AppDataContext.Provider value={value}>
      <WeekDecidedContext.Provider value={weekDecided}>
        {children}
      </WeekDecidedContext.Provider>
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const value = useContext(AppDataContext);
  if (value == null) {
    throw new Error("useAppData needs an AppDataContextProvider above it");
  }
  return value;
}

export function useIsWeekDecided(): boolean {
  return useContext(WeekDecidedContext);
}

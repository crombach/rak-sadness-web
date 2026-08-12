import { Navigate } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import { ScoresView } from "../navbar/ScoresNavbar";
import ResultsFrame from "./ResultsFrame";

/**
 * Sends `/scoreboard` and `/picks` to the latest week worth showing.
 *
 * That is the newest season with picks, not whichever season ESPN calls current.
 * Between the Super Bowl and the opener those differ: ESPN moves on to the season
 * about to start, which has no picks and would land on a week with nothing in it.
 * `AppDataContext` already asks for the right season, so this only has to wait
 * for its schedule. A season that has finished has all of its weeks behind it, so
 * its current week is its last. A season whose opener is still ahead has no such
 * week, and goes home instead.
 *
 * Shows the wireframe while it waits, because it cannot know where it is going
 * until that schedule has arrived.
 */
export default function CurrentWeekRedirect({ view }: { view: ScoresView }) {
  const { seasonYear, currentWeek, weeks, isWeekInfoLoading } = useAppData();

  if (!isWeekInfoLoading) {
    // The schedule lookup failed and already said so in its own toast, or the
    // season has no week to show. Home, as the week route guard does for both.
    if (weeks == null || currentWeek == null) {
      return <Navigate to="/" replace />;
    }
    if (seasonYear != null) {
      return (
        <Navigate
          to={`/${seasonYear}/${currentWeek}/${view.toLowerCase()}`}
          replace
        />
      );
    }
  }

  return <ResultsFrame view={view} />;
}

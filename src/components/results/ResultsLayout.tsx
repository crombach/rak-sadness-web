import { Outlet, useMatch, useNavigate, useParams } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import useWeekRouteGuard from "../../hooks/useWeekRouteGuard";
import { ScoresView } from "../navbar/ScoresNavbar";
import ResultsFrame from "./ResultsFrame";

/**
 * Chrome for a week's results, shared by both views.
 *
 * A layout route rather than a piece of each view, so switching between the
 * scoreboard and the picks does not remount the refresh button and restart
 * its throttle window.
 */
export default function ResultsLayout() {
  const { season: rawSeason, week: rawWeek } = useParams();
  const navigate = useNavigate();
  const { refresh, isRefreshing, scores } = useAppData();
  const guard = useWeekRouteGuard(rawSeason, rawWeek);

  // The route decides which view is showing, not component state.
  const view: ScoresView = useMatch("/:season/:week/picks")
    ? "Picks"
    : "Scoreboard";

  return (
    <ResultsFrame
      view={view}
      isReady={guard.status === "ready"}
      onViewChange={(next) =>
        navigate(`/${rawSeason}/${rawWeek}/${next.toLowerCase()}`, {
          replace: true,
        })
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      scores={scores}
    >
      <Outlet />
    </ResultsFrame>
  );
}

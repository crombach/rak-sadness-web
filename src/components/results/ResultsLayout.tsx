import { Outlet, useMatch, useNavigate, useParams } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import useWeekRouteGuard from "../../hooks/useWeekRouteGuard";
import getClasses from "../../utils/getClasses";
import LogoButton from "../navbar/LogoButton/LogoButton";
import ScoresNavbar, { ScoresView } from "../navbar/ScoresNavbar";
import PageLayout from "../PageLayout";
import SkeletonTable from "../table/SkeletonTable";
import "./ResultsLayout.scss";

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
  const { refresh, isRefreshing } = useAppData();
  const guard = useWeekRouteGuard(rawSeason, rawWeek);

  // The route decides which view is showing, not component state.
  const view: ScoresView = useMatch("/:season/:week/picks")
    ? "Picks"
    : "Scoreboard";

  const isReady = guard.status === "ready";

  return (
    <PageLayout
      // True while loading too: the wireframe is shaped like the table it stands
      // in for, so it wants the same content area.
      showingScores
      scrollable={isReady}
      navbarLeft={<LogoButton onClick={() => navigate("/")} />}
      navbarRight={
        // Rendered while the week loads, so the navbar does not change shape
        // under the pointer once it arrives. Disabled until there is something to
        // switch between.
        <ScoresNavbar
          view={view}
          disabled={!isReady}
          onViewChange={(next) =>
            navigate(`/${rawSeason}/${rawWeek}/${next.toLowerCase()}`, {
              replace: true,
            })
          }
          onRefresh={refresh}
          isRefreshing={isRefreshing}
        />
      }
    >
      <div className={`home__scores ${getClasses({ "--loading": !isReady })}`}>
        {isReady ? <Outlet /> : <SkeletonTable view={view} />}
      </div>
    </PageLayout>
  );
}

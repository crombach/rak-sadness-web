import { Outlet, useMatch, useNavigate, useParams } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import useWeekRouteGuard from "../../hooks/useWeekRouteGuard";
import LogoButton from "../navbar/LogoButton/LogoButton";
import ScoresNavbar, { ScoresView } from "../navbar/ScoresNavbar";
import PageLayout from "../PageLayout";

/**
 * Chrome for a week's results, shared by both views.
 *
 * A layout route rather than a piece of each view, so switching between the
 * scoreboard and the explanation does not remount the refresh button and restart
 * its throttle window.
 */
export default function ResultsLayout() {
  const { week: rawWeek } = useParams();
  const navigate = useNavigate();
  const { refresh, isRefreshing } = useAppData();
  const guard = useWeekRouteGuard(rawWeek);

  // The route decides which view is showing, not component state.
  const view: ScoresView = useMatch("/week/:week/explanation")
    ? "Explanation"
    : "Scoreboard";

  const isReady = guard.status === "ready";

  return (
    <PageLayout
      showingScores={isReady}
      navbarLeft={
        <>
          <LogoButton onClick={() => navigate("/")} />
          <span>{view}</span>
        </>
      }
      navbarRight={
        isReady && (
          <ScoresNavbar
            view={view}
            onViewChange={(next) =>
              navigate(`/week/${guard.week.value}/${next.toLowerCase()}`, {
                replace: true,
              })
            }
            onRefresh={refresh}
            isRefreshing={isRefreshing}
          />
        )
      }
    >
      {isReady && (
        <div className="home__scores">
          <Outlet />
        </div>
      )}
    </PageLayout>
  );
}

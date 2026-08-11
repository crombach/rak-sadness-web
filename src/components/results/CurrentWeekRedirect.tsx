import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import LogoButton from "../navbar/LogoButton/LogoButton";
import ScoresNavbar, { ScoresView } from "../navbar/ScoresNavbar";
import PageLayout from "../PageLayout";
import SkeletonTable from "../table/SkeletonTable";

/**
 * Sends `/scoreboard` and `/picks` to the latest week worth showing.
 *
 * That is the newest season with picks, not whichever season ESPN calls current.
 * Between the Super Bowl and the opener those differ: ESPN moves on to the season
 * about to start, which has no picks and would land on a week with nothing in it.
 * A season that has finished has all of its weeks behind it, so its current week
 * is its last.
 *
 * Shows the wireframe while it works that out, because it cannot know where it is
 * going until both the season list and that season's schedule have arrived.
 */
export default function CurrentWeekRedirect({ view }: { view: ScoresView }) {
  const navigate = useNavigate();
  const {
    selectableSeasons,
    seasonYear,
    currentWeek,
    isSeasonsLoading,
    isWeekInfoLoading,
    setSelectedSeason,
  } = useAppData();

  const [latestSeason] = selectableSeasons;
  const hasSchedule = latestSeason != null && latestSeason === seasonYear;

  useEffect(() => {
    if (latestSeason != null && !isWeekInfoLoading && !hasSchedule) {
      setSelectedSeason(latestSeason);
    }
  }, [latestSeason, isWeekInfoLoading, hasSchedule, setSelectedSeason]);

  if (
    !isSeasonsLoading &&
    !isWeekInfoLoading &&
    hasSchedule &&
    currentWeek != null
  ) {
    return (
      <Navigate
        to={`/${seasonYear}/${currentWeek}/${view.toLowerCase()}`}
        replace
      />
    );
  }

  return (
    <PageLayout
      showingScores
      scrollable={false}
      navbarLeft={<LogoButton onClick={() => navigate("/")} />}
      navbarRight={
        <ScoresNavbar
          view={view}
          disabled
          onViewChange={() => undefined}
          onRefresh={() => undefined}
          isRefreshing={false}
        />
      }
    >
      <div className="home__scores --loading">
        <SkeletonTable view={view} />
      </div>
    </PageLayout>
  );
}

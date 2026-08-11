import { PropsWithChildren } from "react";
import { useNavigate } from "react-router";
import { useIsWeekDecided } from "../../context/AppDataContext";
import getClasses from "../../utils/getClasses";
import LogoButton from "../navbar/LogoButton/LogoButton";
import ScoresNavbar, { ScoresView } from "../navbar/ScoresNavbar";
import PageLayout from "../PageLayout";
import SkeletonTable from "../table/SkeletonTable";
import "./ResultsFrame.scss";

const doNothing = () => undefined;

/**
 * The page a week's results are shown on, and the wireframe that stands in for
 * them.
 *
 * Shared by every route that can end up waiting, so the wireframe a redirect
 * shows while it works out where it is going is the same one the results
 * themselves arrive in.
 */
export default function ResultsFrame({
  view,
  isReady = false,
  onViewChange = doNothing,
  onRefresh = doNothing,
  isRefreshing = false,
  children,
}: PropsWithChildren<{
  view: ScoresView;
  /** Left false by a route that has nothing to show and never will. */
  isReady?: boolean;
  onViewChange?: (view: ScoresView) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}>) {
  const navigate = useNavigate();
  // Once every game is final there is nothing left to fetch, so the refresh
  // button and the divider beside it go rather than sit there doing nothing.
  const isWeekDecided = useIsWeekDecided();

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
          canRefresh={!isWeekDecided}
          onViewChange={onViewChange}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      }
    >
      <div className={`home__scores ${getClasses({ "--loading": !isReady })}`}>
        {isReady ? children : <SkeletonTable view={view} />}
      </div>
    </PageLayout>
  );
}

import { PropsWithChildren, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useIsWeekDecided } from "../../context/AppDataContext";
import { PlayerAnalysisContextProvider } from "../../context/PlayerAnalysisContext";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getClasses from "../../utils/getClasses";
import LogoButton from "../navbar/LogoButton/LogoButton";
import ScoresNavbar, { ScoresView } from "../navbar/ScoresNavbar";
import PageLayout from "../PageLayout";
import PlayerAnalysisDialog from "../playerAnalysis/PlayerAnalysisDialog";
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
  scores,
  children,
}: PropsWithChildren<{
  view: ScoresView;
  /** Left false by a route that has nothing to show and never will. */
  isReady?: boolean;
  onViewChange?: (view: ScoresView) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** What the player analysis is worked out from. Absent while a week loads. */
  scores?: RakMadnessScores;
}>) {
  const navigate = useNavigate();
  // Absent on the redirect routes, which render this frame before they know which
  // week they are headed for.
  const { season, week } = useParams();
  // Once every game is final there is nothing left to fetch, so the refresh button
  // and the divider beside it go rather than sit there doing nothing.
  const isWeekDecided = useIsWeekDecided();
  // A name is the only way in, so the dialog is open exactly while one is held.
  const [analysisPlayer, setAnalysisPlayer] = useState<string>();

  return (
    <PageLayout
      title={
        season && week
          ? `${season} Week ${week} ${view}`
          : `Rak Madness ${view}`
      }
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
          isWeekLive={!isWeekDecided}
          onViewChange={onViewChange}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      }
    >
      <div className={`home__scores ${getClasses({ "--loading": !isReady })}`}>
        <PlayerAnalysisContextProvider showPlayerAnalysis={setAnalysisPlayer}>
          {isReady ? children : <SkeletonTable view={view} />}
        </PlayerAnalysisContextProvider>
      </div>
      <PlayerAnalysisDialog
        open={analysisPlayer != null}
        // Cleared on the way out, so naming the same player again is a change the
        // dialog can see.
        onOpenChange={(open) => {
          if (!open) setAnalysisPlayer(undefined);
        }}
        player={analysisPlayer}
        scores={scores}
        week={week != null ? Number(week) : undefined}
      />
    </PageLayout>
  );
}

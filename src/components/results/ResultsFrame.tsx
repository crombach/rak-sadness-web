import { PropsWithChildren, useCallback, useState } from "react";
import { useNavigate } from "react-router";
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
  // Once every game is final there is nothing left to fetch, and the analysis of
  // every player is settled, so the refresh and analysis buttons and the divider
  // beside them go rather than sit there doing nothing. A player's name still
  // opens the analysis, which then reads as the week's result.
  const isWeekDecided = useIsWeekDecided();
  const [isAnalysisOpen, setAnalysisOpen] = useState(false);
  const [analysisPlayer, setAnalysisPlayer] = useState<string>();

  const showPlayerAnalysis = useCallback((playerName: string) => {
    setAnalysisPlayer(playerName);
    setAnalysisOpen(true);
  }, []);

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
          isWeekLive={!isWeekDecided}
          onViewChange={onViewChange}
          onRefresh={onRefresh}
          onShowAnalysis={() => {
            setAnalysisPlayer(undefined);
            setAnalysisOpen(true);
          }}
          isRefreshing={isRefreshing}
        />
      }
    >
      <div className={`home__scores ${getClasses({ "--loading": !isReady })}`}>
        <PlayerAnalysisContextProvider showPlayerAnalysis={showPlayerAnalysis}>
          {isReady ? children : <SkeletonTable view={view} />}
        </PlayerAnalysisContextProvider>
      </div>
      <PlayerAnalysisDialog
        open={isAnalysisOpen}
        // Cleared on the way out, so naming the same player again is a change the
        // dialog can see.
        onOpenChange={(open) => {
          setAnalysisOpen(open);
          if (!open) setAnalysisPlayer(undefined);
        }}
        player={analysisPlayer}
        scores={scores}
      />
    </PageLayout>
  );
}

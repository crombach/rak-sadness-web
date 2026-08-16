import { PropsWithChildren } from "react";
import createCallbackContext from "./createCallbackContext";

/**
 * How anything under the results routes opens the player analysis on one player.
 *
 * Its own context rather than a prop threaded down, because the tables reach the
 * page through a routed `Outlet` and cannot be handed a callback on the way.
 */
const [PlayerAnalysisContext, useShowPlayerAnalysis] =
  createCallbackContext<string>();

export function PlayerAnalysisContextProvider({
  showPlayerAnalysis,
  children,
}: PropsWithChildren<{ showPlayerAnalysis: (playerName: string) => void }>) {
  return (
    <PlayerAnalysisContext.Provider value={showPlayerAnalysis}>
      {children}
    </PlayerAnalysisContext.Provider>
  );
}

export { useShowPlayerAnalysis };

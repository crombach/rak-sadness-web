import { createContext, PropsWithChildren, useContext } from "react";

const doNothing = () => undefined;

/**
 * How anything under the results routes opens the player analysis on one player.
 *
 * Its own context rather than a prop threaded down, because the tables reach the
 * page through a routed `Outlet` and cannot be handed a callback on the way. A
 * no-op with no provider above, so a table can still be rendered on its own with
 * scores handed straight to it.
 */
const PlayerAnalysisContext =
  createContext<(playerName: string) => void>(doNothing);

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

export function useShowPlayerAnalysis(): (playerName: string) => void {
  return useContext(PlayerAnalysisContext);
}

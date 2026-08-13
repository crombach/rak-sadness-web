import { createContext, PropsWithChildren, useContext } from "react";

const doNothing = () => undefined;

/**
 * How anything under the results routes opens the game status on one game.
 *
 * Its own context rather than a prop threaded down, because the tables reach the
 * page through a routed `Outlet` and cannot be handed a callback on the way. A
 * no-op with no provider above, so a table can still be rendered on its own with
 * scores handed straight to it.
 */
const GameStatusContext = createContext<(gameLabel: string) => void>(doNothing);

export function GameStatusContextProvider({
  showGameStatus,
  children,
}: PropsWithChildren<{ showGameStatus: (gameLabel: string) => void }>) {
  return (
    <GameStatusContext.Provider value={showGameStatus}>
      {children}
    </GameStatusContext.Provider>
  );
}

export function useShowGameStatus(): (gameLabel: string) => void {
  return useContext(GameStatusContext);
}

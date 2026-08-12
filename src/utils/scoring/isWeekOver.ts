import { PlayerScore } from "../../types/RakMadnessScores";
import remainingGames from "./remainingGames";
import unscoreableGames from "./unscoreableGames";

/**
 * Whether a week has a result to state: every game played, and every one of them
 * scoreable. A game nobody could be scored on is a hole in the week, so a leader
 * standing over one is not the winner yet however few games are still being played.
 *
 * Not `isWeekDecided`, which asks whether the knockouts have settled who won. This
 * asks only whether the week itself has run out.
 */
export default function isWeekOver(players: Array<PlayerScore>): boolean {
  return (
    players.length > 0 &&
    remainingGames(players).length === 0 &&
    unscoreableGames(players).length === 0
  );
}

import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";

/**
 * Whether the week is over: every game scored cleanly, and the Monday night total
 * that settles the tiebreaker is in.
 *
 * Whoever the knockouts left standing at that point has won, so nothing here
 * looks at a score. A game that could not be scored leaves the week undecided,
 * because the pick nobody could settle might be the one that decides it.
 */
export default function isWeekDecided(scores: RakMadnessScores): boolean {
  if (scores.tiebreaker == null) {
    return false;
  }
  return scores.scores.every((player: PlayerScore) =>
    [...player.college, ...player.pro].every(
      (result) => result.status === "yes" || result.status === "no",
    ),
  );
}

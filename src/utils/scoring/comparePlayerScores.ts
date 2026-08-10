import { PlayerScore } from "../../types/RakMadnessScores";

type Tier = (a: PlayerScore, b: PlayerScore) => number;

/** Ranks the higher value first. */
function highestFirst(a: number, b: number): number {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
}

/** Ranks the lower value first. */
function lowestFirst(a: number, b: number): number {
  return -highestFirst(a, b);
}

function firstAlphabetically(a: string, b: string): number {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

/**
 * Tiebreakers in order: Monday night points distance, college games picked
 * correctly, then pro games with spreads picked correctly.
 */
const TIERS: Array<Tier> = [
  // Players with no picks always sort last.
  (a, b) =>
    highestFirst(Number(!a.status.hasNoPicks), Number(!b.status.hasNoPicks)),
  (a, b) => highestFirst(a.score.total, b.score.total),
  (a, b) =>
    // A player who left the points cell blank has no distance, so this tier
    // cannot separate them and falls through to the next one.
    a.tiebreaker.distance != null && b.tiebreaker.distance != null
      ? lowestFirst(a.tiebreaker.distance, b.tiebreaker.distance)
      : 0,
  (a, b) => highestFirst(a.score.college, b.score.college),
  (a, b) =>
    highestFirst(a.score.proAgainstTheSpread, b.score.proAgainstTheSpread),
  (a, b) => firstAlphabetically(a.name.toUpperCase(), b.name.toUpperCase()),
];

export default function comparePlayerScores(
  a: PlayerScore,
  b: PlayerScore,
): number {
  for (const tier of TIERS) {
    const result = tier(a, b);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
}

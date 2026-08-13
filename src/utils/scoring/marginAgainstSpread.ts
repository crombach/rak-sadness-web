import { LeagueResult } from "../../types/LeagueResult";

/**
 * How far a side finished ahead once the pool's line is applied, from that side's own
 * point of view. Zero is a push, and anything above it is a point.
 *
 * `points` is the line written from `team`'s side, which is the sign the picks carry
 * and the sign `weekGames` normalizes a spread to. Read from the other side, the same
 * game gives the same number negated.
 *
 * A game with no winner is level, and `winner.by` is zero either way, so a tie reads as
 * a push and scores for everybody. The number means nothing until the game is final,
 * because that is when `winner.by` is settled.
 */
export default function marginAgainstSpread(
  result: LeagueResult,
  team: string,
  points: number,
): number {
  const winner = result.winner.team;
  const ahead =
    winner == null || winner.abbreviation === team
      ? result.winner.by
      : -result.winner.by;
  return ahead + points;
}

import { GameStatus } from "../../types/ESPN";
import { LeagueResult } from "../../types/LeagueResult";
import parsePick from "./parsePick";

/**
 * The Monday night game's real total score, which every player's points guess is
 * measured against. Undefined until that game is final.
 */
export default function getTiebreakerScore(
  tiebreakerGameKey: string | undefined,
  firstRow: any,
  collegeResults: Array<LeagueResult>,
  proResults: Array<LeagueResult>,
): number | undefined {
  // A sheet with no `Pts` column names no tiebreaker game. Nothing to measure a
  // guess against, so the week simply never reads as decided.
  if (tiebreakerGameKey == null) return undefined;
  const { teamAbbreviation: tiebreakerTeam } = parsePick(
    firstRow[tiebreakerGameKey],
  );
  return (tiebreakerGameKey.startsWith("P") ? proResults : collegeResults)
    .filter((result) => result.status === GameStatus.FINAL)
    .find((result) => {
      return (
        result.home.team.abbreviation === tiebreakerTeam ||
        result.away.team.abbreviation === tiebreakerTeam
      );
    })?.totalScore;
}

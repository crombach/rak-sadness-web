import { League, WeekInfo } from "../../types/League";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import debugLog from "../debugLog";
import { getLeagueResults } from "../getLeagueResults";
import applyKnockouts from "./applyKnockouts";
import getTiebreakerScore from "./getTiebreakerScore";
import parsePicksWorkbook from "./parsePicksWorkbook";
import scorePlayers from "./scorePlayers";
import weekGames from "./weekGames";

/**
 * `season` is the year the week's season started in, so a week played in January
 * still scores against the season it belongs to.
 */
export async function getPlayerScores(
  week: WeekInfo,
  picksBuffer: ArrayBuffer,
  season?: number,
): Promise<RakMadnessScores> {
  const parsed = await parsePicksWorkbook(picksBuffer);

  const [collegeResults, proResults] = await Promise.all([
    getLeagueResults(League.COLLEGE, week, parsed.collegeMatchups, season),
    getLeagueResults(League.PRO, week, parsed.proMatchups, season),
  ]);
  debugLog("league results", { collegeResults, proResults });

  const tiebreakerScore = getTiebreakerScore(
    parsed.tiebreakerGameKey,
    parsed.rows[0],
    collegeResults,
    proResults,
  );

  const sortedScores = scorePlayers(
    parsed,
    { college: collegeResults, pro: proResults },
    tiebreakerScore,
  );

  return {
    tiebreaker: tiebreakerScore,
    scores: applyKnockouts(sortedScores, tiebreakerScore),
    games: weekGames(parsed, {
      college: collegeResults,
      pro: proResults,
    }),
  };
}

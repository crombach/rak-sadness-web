import { League, WeekInfo } from "../../types/League";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import debugLog from "../debugLog";
import { getLeagueResults } from "../getLeagueResults";
import applyKnockouts from "./applyKnockouts";
import getTiebreakerScore from "./getTiebreakerScore";
import parsePicksWorkbook from "./parsePicksWorkbook";
import scorePlayers from "./scorePlayers";

export async function getPlayerScores(
  week: WeekInfo,
  picksBuffer: ArrayBuffer,
): Promise<RakMadnessScores> {
  const parsed = await parsePicksWorkbook(picksBuffer);

  const collegeResults = await getLeagueResults(
    League.COLLEGE,
    week,
    parsed.collegeMatchups,
  );
  const proResults = await getLeagueResults(
    League.PRO,
    week,
    parsed.proMatchups,
  );
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
  };
}

import { GameScore } from "../../types/GameScore";
import { LeagueResult } from "../../types/LeagueResult";
import { PlayerScore } from "../../types/RakMadnessScores";
import comparePlayerScores from "./comparePlayerScores";
import { getPickResults, getStatus } from "./getPickResults";
import { ParsedPicks, TIEBREAKER_PICK_KEY } from "./parsePicksWorkbook";

function sumPointValues(scores: Array<GameScore>): number {
  return scores.reduce((sum, score) => sum + score.pointValue, 0);
}

/** Scores every row in the workbook, highest first. */
export default function scorePlayers(
  parsed: ParsedPicks,
  results: { college: Array<LeagueResult>; pro: Array<LeagueResult> },
  tiebreakerScore?: number,
): Array<PlayerScore> {
  const scores: Array<PlayerScore> = parsed.rows.map((playerRow: any) => {
    const collegePicks = parsed.collegeKeys.map((key) => playerRow[key]);
    const proPicks = parsed.proKeys.map((key) => playerRow[key]);
    const hasNoPicks =
      !collegePicks.some((it) => it != null) &&
      !proPicks.some((it) => it != null);

    const collegePickResults = getPickResults(collegePicks, results.college);
    const scoreCollege = sumPointValues(
      collegePickResults.filter((result) => result.isCompleted),
    );

    const proPickResults = getPickResults(proPicks, results.pro);
    const proPickResultsCompleted = proPickResults.filter(
      (result) => result.isCompleted,
    );
    const scorePro = sumPointValues(proPickResultsCompleted);
    const scoreProAgainstTheSpread = sumPointValues(
      proPickResultsCompleted.filter((score) => score.hasSpread),
    );

    const tiebreakerPick = playerRow[TIEBREAKER_PICK_KEY];
    return {
      name: playerRow.Name,
      score: {
        total: scoreCollege + scorePro,
        college: scoreCollege,
        pro: scorePro,
        proAgainstTheSpread: scoreProAgainstTheSpread,
      },
      tiebreaker: {
        pick: tiebreakerPick,
        distance:
          tiebreakerPick != null && tiebreakerScore != null
            ? Math.abs(tiebreakerPick - tiebreakerScore)
            : undefined,
      },
      college: collegePicks.map((pick, index) => ({
        pick,
        status: getStatus(collegePickResults[index]),
        explanation: collegePickResults[index].explanation,
      })),
      pro: proPicks.map((pick, index) => ({
        pick,
        status: getStatus(proPickResults[index]),
        explanation: proPickResults[index].explanation,
      })),
      status: {
        isKnockedOut: hasNoPicks,
        hasNoPicks,
      },
    };
  });

  return scores.sort(comparePlayerScores);
}

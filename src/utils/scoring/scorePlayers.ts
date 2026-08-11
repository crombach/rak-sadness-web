import { GameScore } from "../../types/GameScore";
import { LeagueResult } from "../../types/LeagueResult";
import { PlayerScore } from "../../types/RakMadnessScores";
import comparePlayerScores from "./comparePlayerScores";
import {
  getPickResults,
  getStatus,
  indexResultsByTeam,
} from "./getPickResults";
import { ParsedPicks, TIEBREAKER_PICK_KEY } from "./parsePicksWorkbook";

function sumPointValues(scores: Array<GameScore>): number {
  return scores.reduce((sum, score) => sum + score.pointValue, 0);
}

/** Restates a per-game map as positions, which is how a row's picks arrive. */
function byPickIndex<T>(
  gameKeys: Array<string>,
  byGameKey: Map<string, T>,
): Map<number, T> {
  const byIndex = new Map<number, T>();
  gameKeys.forEach((gameKey, index) => {
    const value = byGameKey.get(gameKey);
    if (value != null) {
      byIndex.set(index, value);
    }
  });
  return byIndex;
}

/** Scores every row in the workbook, highest first. */
export default function scorePlayers(
  parsed: ParsedPicks,
  results: { college: Array<LeagueResult>; pro: Array<LeagueResult> },
  tiebreakerScore?: number,
): Array<PlayerScore> {
  // Built here, not per player: every row resolves its picks against the same
  // games.
  const collegeResultsByTeam = indexResultsByTeam(results.college);
  const proResultsByTeam = indexResultsByTeam(results.pro);
  const unscoreableCollege = byPickIndex(
    parsed.collegeKeys,
    parsed.inconsistentSpreadGames,
  );
  const unscoreablePro = byPickIndex(
    parsed.proKeys,
    parsed.inconsistentSpreadGames,
  );
  const collegeSpreads = byPickIndex(parsed.collegeKeys, parsed.gameSpreads);
  const proSpreads = byPickIndex(parsed.proKeys, parsed.gameSpreads);

  const scores: Array<PlayerScore> = parsed.rows.map((playerRow: any) => {
    const collegePicks = parsed.collegeKeys.map((key) => playerRow[key]);
    const proPicks = parsed.proKeys.map((key) => playerRow[key]);
    const hasNoPicks =
      !collegePicks.some((it) => it != null) &&
      !proPicks.some((it) => it != null);

    const collegePickResults = getPickResults(
      collegePicks,
      collegeResultsByTeam,
      unscoreableCollege,
      collegeSpreads,
    );
    const scoreCollege = sumPointValues(
      collegePickResults.filter((result) => result.isCompleted),
    );

    const proPickResults = getPickResults(
      proPicks,
      proResultsByTeam,
      unscoreablePro,
      proSpreads,
    );
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

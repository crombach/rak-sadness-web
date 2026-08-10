import { PlayerScore } from "../../types/RakMadnessScores";
import parsePick from "./parsePick";

function ifNotOne(num: number, otherwise: string): string {
  return num !== 1 ? otherwise : "";
}

type PairDifferences = {
  differentCollegePicks: number;
  differentProPicks: number;
  differentProPicksWithSpreads: number;
};

/**
 * How many of the games still to be played these two players have picked
 * differently, which is the most ground the active player can still make up.
 *
 * A spread describes the game, so either row answers whether one is on it.
 * `parsePicksWorkbook` refuses to score a game whose rows disagree, which is what
 * makes reading the active player's own pick equivalent to reading the opponent's.
 */
function countDifferences(
  activeScore: PlayerScore,
  oppScore: PlayerScore,
  remainingCollegeIndices: Array<number>,
  remainingProIndices: Array<number>,
): PairDifferences {
  const differentCollegePicks = remainingCollegeIndices.reduce(
    (sum, gameIndex) => {
      const oppPick = oppScore.college[gameIndex].pick;
      const activePick = activeScore.college[gameIndex].pick;
      return oppPick != null && activePick != null && oppPick !== activePick
        ? sum + 1
        : sum;
    },
    0,
  );

  let differentProPicks = 0;
  let differentProPicksWithSpreads = 0;
  remainingProIndices.forEach((gameIndex) => {
    const oppPick = oppScore.pro[gameIndex].pick;
    const activePick = activeScore.pro[gameIndex].pick;
    if (oppPick != null && activePick != null && oppPick !== activePick) {
      differentProPicks += 1;
      if (parsePick(activePick).spread !== 0) {
        differentProPicksWithSpreads += 1;
      }
    }
  });

  return {
    differentCollegePicks,
    differentProPicks,
    differentProPicksWithSpreads,
  };
}

/**
 * Marks every player who can no longer catch the leader, with the reason.
 *
 * Assumes the team abbreviations are all correct. If they are not, or the games
 * cannot be found for some other reason, the results will be wrong.
 */
export default function applyKnockouts(
  sortedScores: Array<PlayerScore>,
  tiebreakerScore?: number,
): Array<PlayerScore> {
  const remainingCollegeIndices = sortedScores[0].college
    .map((pickResult, index) => {
      return pickResult.status === "incomplete" ? index : null;
    })
    .filter((it) => it != null);
  const remainingProIndices = sortedScores[0].pro
    .map((pickResult, index) => {
      return pickResult.status === "incomplete" ? index : null;
    })
    .filter((it) => it != null);

  return sortedScores.map((activeScore, activeIndex) => {
    // If a player has no picks, they're knocked out.
    if (activeScore.status.hasNoPicks) {
      return {
        ...activeScore,
        status: {
          ...activeScore.status,
          explanation: `Knocked out due to having no picks.`,
        },
      };
    }

    // The first player is the leader, so we can skip them if the games are all over. They're not knocked out.
    // For each player with the same score or better, see if they have knocked the active player out.
    // We check players with the same score who are ranked lower in case the players have the same MNF tiebreaker pick.
    if (activeIndex > 0) {
      for (
        let oppIndex = 0;
        oppIndex < sortedScores.length &&
        sortedScores[oppIndex].score.total >= activeScore.score.total;
        oppIndex++
      ) {
        const oppScore = sortedScores[oppIndex];

        // No use comparing a player to themself or a player with no picks.
        if (oppIndex === activeIndex || oppScore.status.hasNoPicks) continue;

        const {
          differentCollegePicks,
          differentProPicks,
          differentProPicksWithSpreads,
        } = countDifferences(
          activeScore,
          oppScore,
          remainingCollegeIndices,
          remainingProIndices,
        );

        const totalScoreDiff = oppScore.score.total - activeScore.score.total;
        const totalDifferentPicks = differentCollegePicks + differentProPicks;
        if (totalDifferentPicks < totalScoreDiff) {
          // If the active player can't catch up on points, they're knocked out.
          return {
            ...activeScore,
            status: {
              ...activeScore.status,
              isKnockedOut: true,
              explanation:
                `Knocked out on Total Score by ${oppScore.name}. ` +
                `Behind by ${totalScoreDiff} with ${totalDifferentPicks} different pick${ifNotOne(totalDifferentPicks, "s")} remaining.`,
            },
          };
        } else if (totalDifferentPicks === totalScoreDiff) {
          // Either distance is absent when that player left the Monday night
          // points cell blank, even once the game itself is final.
          const oppDistance = oppScore.tiebreaker.distance;
          const activeDistance = activeScore.tiebreaker.distance;
          // If the best a player can do is tie the opponent, check if they're knocked out on breakers.
          if (
            oppScore.tiebreaker.pick === activeScore.tiebreaker.pick ||
            (tiebreakerScore != null && oppDistance === activeDistance)
          ) {
            // If the active player has the same tiebreaker pick as the opponent, run through the list of other tiebreakers.
            // If the opponent has a better college score, check if the active player can catch up.
            const collegeScoreDiff =
              oppScore.score.college - activeScore.score.college;
            if (
              collegeScoreDiff > 0 &&
              differentCollegePicks < collegeScoreDiff
            ) {
              return {
                ...activeScore,
                status: {
                  ...activeScore.status,
                  isKnockedOut: true,
                  explanation:
                    `Knocked out on College Score tiebreaker by ${oppScore.name}. ` +
                    `Behind by ${collegeScoreDiff} with ${differentCollegePicks} different college pick${ifNotOne(differentCollegePicks, "s")} remaining.`,
                },
              };
            }
            // If college games are done and players are tied, check pro against the spread tiebreaker.
            if (
              collegeScoreDiff === 0 &&
              remainingCollegeIndices.length === 0
            ) {
              const proAgainstTheSpreadScoreDiff =
                oppScore.score.proAgainstTheSpread -
                activeScore.score.proAgainstTheSpread;
              if (
                proAgainstTheSpreadScoreDiff > 0 &&
                differentProPicksWithSpreads < proAgainstTheSpreadScoreDiff
              ) {
                return {
                  ...activeScore,
                  status: {
                    ...activeScore.status,
                    isKnockedOut: true,
                    explanation:
                      `Knocked out on Pro Score Against the Spread tiebreaker by ${oppScore.name}. ` +
                      `Behind by ${proAgainstTheSpreadScoreDiff} with ${differentProPicksWithSpreads} different pick${ifNotOne(differentProPicksWithSpreads, "s")} remaining ` +
                      `for pro games with spreads.`,
                  },
                };
              }
            }
          } else if (
            tiebreakerScore != null &&
            oppDistance != null &&
            activeDistance != null &&
            oppDistance - activeDistance < 0
          ) {
            // If the tiebreaker score has been scraped, all games must be over.
            // Unless the active player has tied the opponent, they are knocked out.
            return {
              ...activeScore,
              status: {
                ...activeScore.status,
                isKnockedOut: true,
                explanation:
                  `Knocked out on MNF Points tiebreaker by ${oppScore.name}. ` +
                  `${activeScore.name} is ${activeDistance} point${ifNotOne(activeDistance, "s")} off, and ${oppScore.name} is ` +
                  `${oppDistance} point${ifNotOne(oppDistance, "s")} off.`,
              },
            };
          }
        }
      }
    }

    return {
      ...activeScore,
      status: {
        ...activeScore.status,
        isKnockedOut: false,
        explanation: tiebreakerScore != null ? "Winner!" : "Not knocked out!",
      },
    };
  });
}

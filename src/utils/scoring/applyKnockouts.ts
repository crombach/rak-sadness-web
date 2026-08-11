import { PlayerScore } from "../../types/RakMadnessScores";
import remainingGames, {
  pickDifference,
  RemainingGame,
} from "./remainingGames";

function ifNotOne(num: number, otherwise: string): string {
  return num !== 1 ? otherwise : "";
}

function knockedOut(score: PlayerScore, explanation: string): PlayerScore {
  return {
    ...score,
    status: { ...score.status, isKnockedOut: true, explanation },
  };
}

type PairDifferences = {
  differentCollegePicks: number;
  differentProPicks: number;
  differentProPicksWithSpreads: number;
};

/**
 * How many of the games still to be played these two players have picked
 * differently, split by the tiebreaker tier each one can move.
 */
function countDifferences(
  games: Array<RemainingGame>,
  activeIndex: number,
  oppIndex: number,
): PairDifferences {
  const differences = {
    differentCollegePicks: 0,
    differentProPicks: 0,
    differentProPicksWithSpreads: 0,
  };
  games.forEach((game) => {
    if (pickDifference(game, activeIndex, oppIndex) === "none") return;
    const mine = game.cells[activeIndex];
    if (game.league === "college") {
      differences.differentCollegePicks += 1;
      return;
    }
    differences.differentProPicks += 1;
    if (mine.hasSpread) {
      differences.differentProPicksWithSpreads += 1;
    }
  });
  return differences;
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
  const games = remainingGames(sortedScores);
  const isCollegeDone = games.every((game) => game.league !== "college");

  return sortedScores.map((activeScore, activeIndex) => {
    // If a player has no picks, they're knocked out.
    if (activeScore.status.hasNoPicks) {
      return knockedOut(activeScore, "Knocked out due to having no picks.");
    }

    // The leader sorts first and cannot be knocked out, so skip them.
    // Everyone else is measured against every player level with them or ahead,
    // including ones ranked below them, which is where an equal score with the
    // same Monday night pick is settled.
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
        } = countDifferences(games, activeIndex, oppIndex);

        const totalScoreDiff = oppScore.score.total - activeScore.score.total;
        const totalDifferentPicks = differentCollegePicks + differentProPicks;
        if (totalDifferentPicks < totalScoreDiff) {
          // If the active player can't catch up on points, they're knocked out.
          return knockedOut(
            activeScore,
            `Knocked out on Total Score by ${oppScore.name}. ` +
              `Behind by ${totalScoreDiff} with ${totalDifferentPicks} different pick${ifNotOne(totalDifferentPicks, "s")} remaining.`,
          );
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
              return knockedOut(
                activeScore,
                `Knocked out on College Score tiebreaker by ${oppScore.name}. ` +
                  `Behind by ${collegeScoreDiff} with ${differentCollegePicks} different college pick${ifNotOne(differentCollegePicks, "s")} remaining.`,
              );
            }
            // If college games are done and players are tied, check pro against the spread tiebreaker.
            if (collegeScoreDiff === 0 && isCollegeDone) {
              const proAgainstTheSpreadScoreDiff =
                oppScore.score.proAgainstTheSpread -
                activeScore.score.proAgainstTheSpread;
              if (
                proAgainstTheSpreadScoreDiff > 0 &&
                differentProPicksWithSpreads < proAgainstTheSpreadScoreDiff
              ) {
                return knockedOut(
                  activeScore,
                  `Knocked out on Pro Score Against the Spread tiebreaker by ${oppScore.name}. ` +
                    `Behind by ${proAgainstTheSpreadScoreDiff} with ${differentProPicksWithSpreads} different pick${ifNotOne(differentProPicksWithSpreads, "s")} remaining ` +
                    `for pro games with spreads.`,
                );
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
            return knockedOut(
              activeScore,
              `Knocked out on MNF Points tiebreaker by ${oppScore.name}. ` +
                `${activeScore.name} is ${activeDistance} point${ifNotOne(activeDistance, "s")} off, and ${oppScore.name} is ` +
                `${oppDistance} point${ifNotOne(oppDistance, "s")} off.`,
            );
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

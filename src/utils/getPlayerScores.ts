import * as XLSX from "xlsx-js-style";
import { GameStatus, HomeAway } from "../types/ESPN";
import { GameScore } from "../types/GameScore";
import { League, WeekInfo } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";
import {
  PlayerScore,
  RakMadnessScores,
  Status,
} from "../types/RakMadnessScores";
import { getLeagueResults } from "./getLeagueResults";

const tiebreakerPickKey = "Pts";

// Capture group 1 is team abbreviation, capture group 3 is spread (if present)
const pickRegex = /([^\s+-]+)(\s*([+-]?\d+(\.\d)?))?/;

function ifNotOne(num: number, otherwise: string): string {
  return num !== 1 ? otherwise : "";
}

function parsePick(pickString: string) {
  const [, teamAbbreviation, , spreadText] = pickRegex.exec(pickString);
  const spread = spreadText != null ? Number(spreadText) : 0;
  return {
    teamAbbreviation:
      teamAbbreviation !== "undefined"
        ? teamAbbreviation.toUpperCase()
        : undefined,
    spread,
  };
}

function getStatus(score: GameScore): Status {
  if (score.wasNotFound) {
    return "error";
  } else if (!score.isCompleted) {
    return "incomplete";
  } else if (score.pointValue === 1) {
    return "yes";
  }
  return "no";
}

function getPickResults(
  picks: Array<string>,
  leagueResults: Array<LeagueResult>,
): Array<GameScore> {
  return picks.map((pick: string) => {
    console.debug("==========");

    // Parse the pick text to extract the selected team abbreviation and spread (if present).
    const { teamAbbreviation: selectedTeam, spread } = parsePick(pick);
    console.debug("Selected Team:", selectedTeam);
    console.debug("Spread:", spread);
    const hasSpread = spread !== 0;

    // Find the game result matching the selected team.
    const gameResult = leagueResults.find((result) => {
      return (
        result.home.team.abbreviation === selectedTeam ||
        result.away.team.abbreviation === selectedTeam
      );
    });
    if (!gameResult) {
      if (selectedTeam) {
        console.warn(
          "FAILED to find game result for team abbreviation:",
          selectedTeam,
        );
      }
      return {
        pointValue: 0,
        explanation: {
          header: selectedTeam ? "Missing Game" : "Missing Pick",
          message: selectedTeam
            ? `Unable to find game result for team with abbreviation ${selectedTeam}`
            : "No selection was made for this game.",
        },
        wasNotFound: true,
        isCompleted: false,
        hasSpread,
      };
    }
    console.debug("Winner:", gameResult.winner);

    // Determine if the player picked the winner.
    // null gameResult.winner.team indicates a tie.
    const pickedWinner =
      gameResult.winner.team === null ||
      gameResult.winner.team.abbreviation === selectedTeam;

    // Check if the player gets a point or not.
    let pointValue: number;
    if (pickedWinner) {
      if (!hasSpread) {
        console.debug("WIN. Picked winner, no spread.");
        pointValue = 1;
      } else if (spread > 0) {
        console.debug("WIN. Picked unfavored winner.");
        pointValue = 1;
      } else if (spread < 0 && gameResult.winner.by > Math.abs(spread)) {
        console.debug("WIN. Picked favored winner, spread covered.");
        pointValue = 1;
      } else if (Math.abs(spread) === gameResult.winner.by) {
        console.debug(
          "WIN. Picked winner, but against the spread the game is a push.",
        );
        pointValue = 1;
      } else {
        console.debug("LOSE. Picked favored winner, but spread not covered.");
        pointValue = 0;
      }
    } else {
      if (!hasSpread) {
        console.debug("LOSE. Picked loser, no spread.");
        pointValue = 0;
      } else if (spread < 0) {
        console.debug("LOSE. Picked favored loser.");
        pointValue = 0;
      } else if (spread > 0 && gameResult.winner.by < Math.abs(spread)) {
        console.debug(
          "WIN. Picked unfavored loser, but winner failed to cover spread.",
        );
        pointValue = 1;
      } else if (Math.abs(spread) === gameResult.winner.by) {
        console.debug(
          "WIN. Picked loser, but against the spread the game is a push.",
        );
        pointValue = 1;
      } else {
        console.debug(
          "LOSE. Picked unfavored loser, and winner covered spread.",
        );
        pointValue = 0;
      }
    }

    let explanationHeader: string;
    switch (gameResult.status) {
      case GameStatus.FINAL: {
        explanationHeader = "Final Score";
        break;
      }
      case GameStatus.UPCOMING: {
        explanationHeader = "Upcoming";
        break;
      }
      default: {
        explanationHeader = `Live Score | ${gameResult.detailMessage}`;
        break;
      }
    }

    return {
      pointValue,
      explanation: {
        header: explanationHeader,
        message:
          gameResult.status === GameStatus.UPCOMING
            ? `${gameResult.away.team.abbreviation} @ ${gameResult.home.team.abbreviation}` +
              ` begins at ${gameResult.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` +
              ` on ${gameResult.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
            : `${gameResult.possession.homeAway === HomeAway.AWAY ? "▸ " : ""}${gameResult.away.team.abbreviation} ${gameResult.away.score}` +
              ` - ` +
              `${gameResult.home.score} ${gameResult.home.team.abbreviation}${gameResult.possession.homeAway === HomeAway.HOME ? " ◂" : ""}`,
        downDistanceText:
          gameResult.possession.homeAway != null
            ? gameResult.possession.downDistanceText
            : "",
      },
      wasNotFound: false,
      isCompleted: gameResult.status === GameStatus.FINAL,
      hasSpread,
    };
  });
}

export async function readFileToBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function getPlayerScores(
  week: WeekInfo,
  picksBuffer: ArrayBuffer,
): Promise<RakMadnessScores> {
  // Parse the Excel spreadsheet.
  const workbook = XLSX.read(picksBuffer, { type: "array" });
  const picksSheet = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
  const allPicks: Array<any> = XLSX.utils.sheet_to_json(picksSheet);

  // Determine property keys for different game types.
  const allKeys = Object.keys(allPicks[0]);
  const collegeKeys = allKeys.filter((key) => key.startsWith("C"));
  const proKeys = allKeys.filter(
    (key) => key.startsWith("P") && key !== tiebreakerPickKey,
  );
  // The tiebreaker game key should always be the last one before the tiebreaker score pick.
  const tiebreakerGameKey = allKeys[allKeys.indexOf(tiebreakerPickKey) - 1];

  // Determine team matchups.
  const matchups: { [gameKey: string]: Set<string> } = {};
  allPicks.forEach((playerRow: any) => {
    const addToMatchups = (key: string) => {
      if (playerRow[key]) {
        const { teamAbbreviation } = parsePick(playerRow[key]);
        if (!matchups[key]) {
          matchups[key] = new Set<string>();
        }
        matchups[key].add(teamAbbreviation);
      }
    };
    collegeKeys.forEach(addToMatchups);
    proKeys.forEach(addToMatchups);
  });
  const collegeMatchups: Array<Set<string>> = Object.keys(matchups)
    .filter((key) => key.startsWith("C"))
    .map((key) => matchups[key]);
  const proMatchups: Array<Set<string>> = Object.keys(matchups)
    .filter((key) => key.startsWith("P"))
    .map((key) => matchups[key]);
  console.log("college matchups", collegeMatchups);
  console.log("pro matchups", proMatchups);

  // Fetch game results.
  const collegeResults = await getLeagueResults(
    League.COLLEGE,
    week,
    collegeMatchups,
  );
  console.debug("college results", collegeResults);
  const proResults = await getLeagueResults(League.PRO, week, proMatchups);
  console.debug("pro results", proResults);

  // Determine MNF tiebreaker score.
  const { teamAbbreviation: tiebreakerTeam } = parsePick(
    allPicks[0][tiebreakerGameKey],
  );
  const tiebreakerScore = (
    tiebreakerGameKey.startsWith("P") ? proResults : collegeResults
  )
    .filter((result) => result.status === GameStatus.FINAL)
    .find((result) => {
      return (
        result.home.team.abbreviation === tiebreakerTeam ||
        result.away.team.abbreviation === tiebreakerTeam
      );
    })?.totalScore;

  // Iterate over picks.
  const scores: Array<PlayerScore> = allPicks.map((playerRow: any) => {
    // Extract picks from the spreadsheet
    const collegePicks = collegeKeys.map((key) => playerRow[key]);
    const proPicks = proKeys.map((key) => playerRow[key]);
    const hasNoPicks =
      !collegePicks.some((it) => it != null) &&
      !proPicks.some((it) => it != null);

    // Score college picks
    const collegePickResults = getPickResults(collegePicks, collegeResults);
    const collegePickResultsCompleted = collegePickResults.filter(
      (result) => result.isCompleted,
    );
    const scoreCollege = collegePickResultsCompleted.reduce(
      (partialSum: number, score: GameScore) => {
        return partialSum + score.pointValue;
      },
      0,
    );

    // Score pro picks
    const proPickResults = getPickResults(proPicks, proResults);
    const proPickResultsCompleted = proPickResults.filter(
      (result) => result.isCompleted,
    );
    const scorePro = proPickResultsCompleted.reduce(
      (partialSum: number, score: GameScore) => {
        return partialSum + score.pointValue;
      },
      0,
    );
    const scoreProAgainstTheSpread = proPickResultsCompleted.reduce(
      (partialSum: number, score: GameScore) => {
        const gameValue = score.hasSpread ? score.pointValue : 0;
        return partialSum + gameValue;
      },
      0,
    );

    // Return object representing player performance.
    return {
      name: playerRow.Name,
      score: {
        total: scoreCollege + scorePro,
        college: scoreCollege,
        pro: scorePro,
        proAgainstTheSpread: scoreProAgainstTheSpread,
      },
      tiebreaker: {
        pick: playerRow[tiebreakerPickKey],
        distance:
          playerRow[tiebreakerPickKey] != null && tiebreakerScore != null
            ? Math.abs(playerRow[tiebreakerPickKey] - tiebreakerScore)
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

  // Sort results so highest score comes first,
  // with ties broken by (you guessed it) the tiebreakers.
  // Tiebreakers are, in order:
  // 1. Monday Night Football predicted score distance from real score
  // 2. Number of college games picked correctly
  // 3. Number of NFL games with spreads picked correctly
  const sortedScores: Array<PlayerScore> = scores.sort((a, b) => {
    // Players with no picks should always be sorted last.
    if (a.status.hasNoPicks && !b.status.hasNoPicks) {
      return 1;
    } else if (!a.status.hasNoPicks && b.status.hasNoPicks) {
      return -1;
    }
    // Total score
    if (a.score.total < b.score.total) {
      return 1;
    } else if (a.score.total > b.score.total) {
      return -1;
    }
    // Tiebreaker distance
    if (a.tiebreaker.distance != null && b.tiebreaker.distance != null) {
      if (a.tiebreaker.distance > b.tiebreaker.distance) {
        return 1;
      } else if (a.tiebreaker.distance < b.tiebreaker.distance) {
        return -1;
      }
    }
    // College score
    if (a.score.college < b.score.college) {
      return 1;
    } else if (a.score.college > b.score.college) {
      return -1;
    }
    // Pro score against the spread
    if (a.score.proAgainstTheSpread < b.score.proAgainstTheSpread) {
      return 1;
    } else if (a.score.proAgainstTheSpread > b.score.proAgainstTheSpread) {
      return -1;
    }
    // Player name
    if (a.name.toUpperCase() > b.name.toUpperCase()) {
      return 1;
    } else if (a.name.toUpperCase() < b.name.toUpperCase()) {
      return -1;
    }
    return 0;
  });

  // Loop over the sorted results to calculate who can still win.
  // This logic assumes the team abbreviations are all correct.
  // If they're not (or the games can't be found for some other reason), results will be wrong.
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

  const cache: {
    [key: string]: {
      differentCollegePicks: number;
      differentProPicks: number;
      differentProPicksWithSpreads: number;
    };
  } = {};

  const scoresWithKnockouts: Array<PlayerScore> = sortedScores.map(
    (activeScore, activeIndex) => {
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

          // Used cached values or calculate new ones.
          let differentCollegePicks = 0;
          let differentProPicks = 0;
          let differentProPicksWithSpreads = 0;
          const cacheKey = `${Math.min(oppIndex, activeIndex)},${Math.max(
            oppIndex,
            activeIndex,
          )}`;
          const cachedValue = cache[cacheKey];
          if (cachedValue != null) {
            differentCollegePicks = cachedValue.differentCollegePicks;
            differentProPicks = cachedValue.differentProPicks;
            differentProPicksWithSpreads =
              cachedValue.differentProPicksWithSpreads;
          } else {
            // Figure out how many different college picks the players have made.
            differentCollegePicks = remainingCollegeIndices.reduce(
              (sum, gameIndex) => {
                const oppPick = oppScore.college[gameIndex].pick;
                const activePick = activeScore.college[gameIndex].pick;
                return oppPick !== activePick ? sum + 1 : sum;
              },
              0,
            );

            // Figure out how many different pro picks the players have made.
            remainingProIndices.forEach((gameIndex) => {
              const oppPick = oppScore.pro[gameIndex].pick;
              const activePick = activeScore.pro[gameIndex].pick;
              if (oppPick !== activePick) {
                differentProPicks += 1;
                if (parsePick(oppPick).spread !== 0) {
                  differentProPicksWithSpreads += 1;
                }
              }
            });

            // Store the values in the cache
            cache[cacheKey] = {
              differentCollegePicks,
              differentProPicks,
              differentProPicksWithSpreads,
            };
          }

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
            // If the best a player can do is tie the opponent, check if they're knocked out on breakers.
            if (
              oppScore.tiebreaker.pick === activeScore.tiebreaker.pick ||
              (tiebreakerScore != null &&
                oppScore.tiebreaker.distance ===
                  activeScore.tiebreaker.distance)
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
                remainingCollegeIndices.length == 0
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
              oppScore.tiebreaker.distance - activeScore.tiebreaker.distance < 0
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
                    `${activeScore.name} is ${activeScore.tiebreaker.distance} point${ifNotOne(activeScore.tiebreaker.distance, "s")} off, and ${oppScore.name} is ` +
                    `${oppScore.tiebreaker.distance} point${ifNotOne(oppScore.tiebreaker.distance, "s")} off.`,
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
    },
  );

  return {
    tiebreaker: tiebreakerScore,
    scores: scoresWithKnockouts,
  };
}

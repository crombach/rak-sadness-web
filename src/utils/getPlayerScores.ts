import * as XLSX from "xlsx-js-style";
import { GameScore } from "../types/GameScore";
import { League } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";
import { Correctness, PlayerScore, RakMadnessScores } from "../types/RakMadnessScores";
import { getLeagueResults } from "./getLeagueResults";

// Capture group 1 is team abbreviation, capture group 3 is spread (if present)
const pickRegex = /([\S]+)(\s+([+-]?\d+(\.\d)?))?/;

function parsePick(pickString: string) {
    const [, teamAbbreviation, , spreadText] = pickRegex.exec(pickString);
    const spread = spreadText != null ? Number(spreadText) : 0;
    console.debug("spread text", spreadText);
    return { teamAbbreviation: teamAbbreviation.toUpperCase(), spread };
}

function getCorrectness(score: GameScore): Correctness {
    if (score.wasNotFound) { // TODO: Score should always be present.
        return "error";
    } else if (!score.isCompleted) {
        return "incomplete";
    } else if (score.pointValue === 1) {
        return "yes";
    }
    return "no";
}

function getPickResults(picks: Array<string>, leagueResults: Array<LeagueResult>): Array<GameScore> {
    return picks.map((pick: string) => {
        console.debug("==========");

        // Parse the pick text to extract the selected team abbreviation and spread (if present).
        const { teamAbbreviation: selectedTeam, spread } = parsePick(pick);
        console.debug("Selected Team:", selectedTeam);
        console.debug("Spread:", spread);
        const hasSpread = spread !== 0;

        // Find the game result matching the selected team.
        const gameResult = leagueResults.find((result) => {
            return result.home.team.abbreviation === selectedTeam || result.away.team.abbreviation === selectedTeam;
        });
        if (!gameResult) {
            console.error("FAILED to find game result for team abbreviation:", selectedTeam);
            return { pointValue: 0, wasNotFound: true, isCompleted: false, hasSpread };
        }
        console.debug("Winner:", gameResult.winner);

        // Determine if the player picked the winner.
        // null gameResult.winner.team indicates a tie.
        const pickedWinner = gameResult.winner.team === null || gameResult.winner.team.abbreviation === selectedTeam;

        // Check if the player gets a point or not.
        let pointValue: number;
        if (pickedWinner) {
            if (!hasSpread) {
                console.debug("WIN. Picked winner, no spread.")
                pointValue = 1;
            } else if (spread > 0) {
                console.debug("WIN. Picked unfavored winner.");
                pointValue = 1;
            } else if (spread < 0 && gameResult.winner.by > Math.abs(spread)) {
                console.debug("WIN. Picked favored winner, spread covered.");
                pointValue = 1;
            } else if (Math.abs(spread) === gameResult.winner.by) {
                console.debug("WIN. Picked winner, but against the spread the game is a push.");
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
                console.debug("WIN. Picked unfavored loser, but winner failed to cover spread.");
                pointValue = 1;
            } else if (Math.abs(spread) === gameResult.winner.by) {
                console.debug("WIN. Picked loser, but against the spread the game is a push.");
                pointValue = 1;
            } else {
                console.debug("LOSE. Picked unfavored loser, and winner covered spread.");
                pointValue = 0;
            }
        }

        return { pointValue, wasNotFound: false, isCompleted: gameResult.isCompleted, hasSpread };
    });
}

async function readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as ArrayBuffer)
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export default async function getPlayerScores(week: number, picksFile: File): Promise<RakMadnessScores> {
    // Read the provided file into a buffer.
    const buffer = await readFile(picksFile);

    // Parse the Excel spreadsheet.
    const workbook = XLSX.read(buffer, { type: "array" });
    const picksSheet = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
    const allPicks: Array<any> = XLSX.utils.sheet_to_json(picksSheet);

    // Fetch game results.
    const collegeResults = await getLeagueResults(League.COLLEGE, week);
    const proResults = await getLeagueResults(League.PRO, week);

    // Determine property keys for different game types.
    const collegeKeys = Object.keys(allPicks[0]).filter(key => key.startsWith("C"));
    const proKeys = Object.keys(allPicks[0]).filter(key => key.startsWith("P") && key !== "Pts");
    const tiebreakerGameKey = proKeys[proKeys.length - 1];

    // Determine MNF tiebreaker score.
    const { teamAbbreviation: tiebreakerTeam } = parsePick(allPicks[0][tiebreakerGameKey]);
    const tiebreakerScore = proResults.filter(result => result.isCompleted).find((result) => {
        return result.home.team.abbreviation === tiebreakerTeam || result.away.team.abbreviation === tiebreakerTeam;
    })?.totalScore;

    // Iterate over picks.
    const scores: Array<PlayerScore> = allPicks.map((playerRow: any) => {
        // Score college picks
        const collegePicks = collegeKeys.map(key => playerRow[key]);
        const collegePickResults = getPickResults(collegePicks, collegeResults);
        const collegePickResultsCompleted = collegePickResults.filter(result => result.isCompleted);
        const scoreCollege = collegePickResultsCompleted.reduce((partialSum: number, score: GameScore) => {
            return partialSum + score.pointValue;
        }, 0);

        // Score pro picks
        const proPicks = proKeys.map(key => playerRow[key]);
        const proPickResults = getPickResults(proPicks, proResults);
        const proPickResultsCompleted = proPickResults.filter(result => result.isCompleted);
        const scorePro = proPickResultsCompleted.reduce((partialSum: number, score: GameScore) => {
            return partialSum + score.pointValue;
        }, 0);
        const scoreProAgainstTheSpread = proPickResultsCompleted.reduce((partialSum: number, score: GameScore) => {
            const gameValue = score.hasSpread ? score.pointValue : 0;
            return partialSum + gameValue;
        }, 0);

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
                pick: playerRow.Pts,
                distance: playerRow.Pts != null && tiebreakerScore != null ? Math.abs(playerRow.Pts - tiebreakerScore) : undefined,
            },
            college: collegePicks.map((pick, index) => ({ pick, correct: getCorrectness(collegePickResults[index]) })),
            pro: proPicks.map((pick, index) => ({ pick, correct: getCorrectness(proPickResults[index]) })),
            isKnockedOut: false,
        }
    });

    // Sort results so highest score comes first,
    // with ties broken by (you guessed it) the tiebreakers.
    // Tiebreakers are, in order:
    // 1. Monday Night Football predicted score distance from real score
    // 2. Number of college games picked correctly
    // 3. Number of NFL games with spreads picked correctly
    const sortedScores: Array<PlayerScore> = scores.sort((a, b) => {
        // Total score
        if (a.score.total < b.score.total) {
            return 1;
        } else if (a.score.total > b.score.total) {
            return -1;
        }
        // Tiebreaker distance
        if (a.tiebreaker.distance && b.tiebreaker.distance) {
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
        return 0;
    });

    // Loop over the results to calculate who can still win.
    // This logic assumes the the team abbreviations are all correct.
    // If they're not (or the games can't be found for some other reason), results will be wrong.
    // Tiebreakers are not accounted for.
    const topScore = sortedScores[0];
    const remainingCollegeGames: Array<{ index: number; pick: string; }> = [];
    sortedScores[0].college.forEach((pickResult, index) => {
        if (pickResult.correct === "incomplete") {
            remainingCollegeGames.push({ index, pick: pickResult.pick });
        }
    });
    const remainingProGames: Array<{ index: number; pick: string; }> = [];
    sortedScores[0].pro.forEach((pickResult, index) => {
        if (pickResult.correct === "incomplete") {
            remainingProGames.push({ index, pick: pickResult.pick });
        }
    });

    // A player is knocked out if the number of picks they have different from the leader
    // is less than the score differential between them and the leader.
    const scoresWithKnockouts: Array<PlayerScore> = sortedScores.map((playerScore, index) => {
        // The first player is the leader, so we can skip them.
        if (index === 0) {
            return playerScore;
        }

        const differentCollegePicks = remainingCollegeGames.reduce((acc, { index, pick }) => {
            return (playerScore.college[index].pick !== pick) ? acc + 1 : acc;
        }, 0);

        let differentProPicks = 0;
        let differentProPicksWithSpreads = 0;
        remainingProGames.forEach(({ index, pick }) => {
            const activePick = playerScore.pro[index].pick
            if (activePick !== pick) {
                differentProPicks += 1;
                if (parsePick(activePick).spread !== 0) {
                    differentProPicksWithSpreads += 1;
                }
            }
        }, 0);

        const totalScoreDiff = topScore.score.total - playerScore.score.total;
        const totalDifferentPicks = differentCollegePicks + differentProPicks;
        if (totalDifferentPicks < totalScoreDiff) {
            // If the player can't catch up on points, they're knocked out.
            return { ...playerScore, isKnockedOut: true };
        } else if (totalDifferentPicks === totalScoreDiff) {
            // If the best a player can do is tie the leader, check if they're knocked out on breakers.
            if (topScore.tiebreaker.pick === playerScore.tiebreaker.pick) {
                // If the active player has the same tiebreaker pick as the leader, run through the list of other tiebreakers.
                // If the leader has a better college score, check if the active player can catch up.
                const collegeScoreDiff = topScore.score.college - playerScore.score.college;
                if (collegeScoreDiff > 0 && differentCollegePicks < collegeScoreDiff) {
                    return { ...playerScore, isKnockedOut: true };
                }
                // If college games are done and players are tied, check pro against the spread tiebreaker.
                if (collegeScoreDiff === 0 && remainingCollegeGames.length == 0) {
                    const proAgainstTheSpreadScoreDiff = topScore.score.proAgainstTheSpread - playerScore.score.proAgainstTheSpread;
                    if (proAgainstTheSpreadScoreDiff > 0 && differentProPicksWithSpreads < proAgainstTheSpreadScoreDiff) {
                        return { ...playerScore, isKnockedOut: true };
                    }
                }
            } else if (tiebreakerScore != null) {
                // If the tiebreaker score has been scraped, all games must be over.
                // The first player in the leaderboard will be the winner, and all others should be knocked out.
                const tiebreakerDistanceDiff = topScore.tiebreaker.distance - playerScore.tiebreaker.distance;
                if (tiebreakerDistanceDiff < 0) {
                    return { ...playerScore, isKnockedOut: true };
                }
            }
        }

        return playerScore;
    });

    return {
        tiebreaker: tiebreakerScore,
        scores: scoresWithKnockouts,
    };
}
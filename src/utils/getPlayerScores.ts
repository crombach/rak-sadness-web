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
    if (score.wasNotFound) {
        return "unknown";
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
            return { pointValue: 0, wasNotFound: true, hasSpread };
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

        return { pointValue, wasNotFound: false, hasSpread };
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
    const tiebreakerScore = proResults.find((result) => {
        return result.home.team.abbreviation === tiebreakerTeam || result.away.team.abbreviation === tiebreakerTeam;
    })?.totalScore;

    // Iterate over picks.
    const scores: Array<PlayerScore> = allPicks.map((playerRow: any) => {
        // Score college picks
        const collegePicks = collegeKeys.map(key => playerRow[key]);
        const collegePickResults = getPickResults(collegePicks, collegeResults);
        const scoreCollege = collegePickResults.reduce((partialSum: number, score: GameScore) => {
            return partialSum + score.pointValue;
        }, 0);

        // Score pro picks
        const proPicks = proKeys.map(key => playerRow[key]);
        const proPickResults = getPickResults(proPicks, proResults);
        const scorePro = proPickResults.reduce((partialSum: number, score: GameScore) => {
            return partialSum + score.pointValue;
        }, 0);
        const scoreProAgainstTheSpread = proPickResults.reduce((partialSum: number, score: GameScore) => {
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
        }
    });

    // Sort results so highest score comes first,
    // with ties broken by (you guessed it) the tiebreakers.
    // Tiebreakers are, in order:
    // 1. Monday Night Football predicted score distance from real score
    // 2. Number of college games picked correctly
    // 3. Number of NFL games with spreads picked correctly
    const sortedScores: Array<PlayerScore> = scores.sort((a, b) => {
        if (a.score.total < b.score.total) {
            return 1;
        } else if (a.score.total > b.score.total) {
            return -1;
        } else if (a.tiebreaker.distance && b.tiebreaker.distance) {
            if (a.tiebreaker.distance > b.tiebreaker.distance) {
                return 1;
            } else if (a.tiebreaker.distance < b.tiebreaker.distance) {
                return -1;
            }
        } else if (a.score.college < b.score.college) {
            return 1;
        } else if (a.score.college > b.score.college) {
            return -1;
        } else if (a.score.proAgainstTheSpread < b.score.proAgainstTheSpread) {
            return 1;
        } else if (a.score.proAgainstTheSpread > b.score.proAgainstTheSpread) {
            return -1;
        }
        return 0;
    });

    return {
        tiebreaker: tiebreakerScore,
        scores: sortedScores,
    };
}
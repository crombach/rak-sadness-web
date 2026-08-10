import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameScore } from "../../types/GameScore";
import { LeagueResult } from "../../types/LeagueResult";
import { Status } from "../../types/RakMadnessScores";
import debugLog from "../debugLog";
import parsePick from "./parsePick";

export function getStatus(score: GameScore): Status {
  if (score.isInvalid) {
    return "error";
  } else if (!score.isCompleted) {
    return "incomplete";
  } else if (score.pointValue === 1) {
    return "yes";
  }
  return "no";
}

/**
 * Indexes both sides of every game by team abbreviation. First result wins, so a
 * team playing twice in a week resolves to its earliest game.
 */
export function indexResultsByTeam(
  leagueResults: Array<LeagueResult>,
): Map<string, LeagueResult> {
  const byTeam = new Map<string, LeagueResult>();
  leagueResults.forEach((result) => {
    [result.home.team.abbreviation, result.away.team.abbreviation].forEach(
      (abbreviation) => {
        if (!byTeam.has(abbreviation)) {
          byTeam.set(abbreviation, result);
        }
      },
    );
  });
  return byTeam;
}

/**
 * A pick with no point in it either way. Every reason a game cannot be scored ends
 * here, and they share `isInvalid` because they share that outcome. Only the
 * explanation differs, since only the user can act on the difference.
 */
function unscoreable(
  header: string,
  message: string,
  hasSpread: boolean,
): GameScore {
  return {
    pointValue: 0,
    explanation: { header, message },
    isInvalid: true,
    isCompleted: false,
    hasSpread,
  };
}

/**
 * Takes the index rather than the games, so scoring builds it once per week.
 *
 * `spreadDisagreements` maps a position in `picks` to the workbook's own
 * contradiction about that game's spread. A game described two ways scores for
 * nobody, so the whole column comes back unscoreable rather than resolving the
 * contradiction one way and quietly handing out points on it.
 */
export function getPickResults(
  picks: Array<string>,
  resultsByTeam: Map<string, LeagueResult>,
  spreadDisagreements: Map<number, string> = new Map(),
): Array<GameScore> {
  return picks.map((pick: string, index: number) => {
    // Parse the pick text to extract the selected team abbreviation and spread (if present).
    const { teamAbbreviation: selectedTeam, spread } = parsePick(pick);
    const hasSpread = spread !== 0;

    const spreadDisagreement = spreadDisagreements.get(index);
    if (spreadDisagreement != null) {
      return unscoreable("Invalid Spread", spreadDisagreement, hasSpread);
    }
    if (selectedTeam == null) {
      return unscoreable(
        "Missing Pick",
        "No selection was made for this game.",
        hasSpread,
      );
    }

    // Find the game result matching the selected team.
    const gameResult = resultsByTeam.get(selectedTeam);
    if (!gameResult) {
      console.warn(
        "FAILED to find game result for team abbreviation:",
        selectedTeam,
      );
      return unscoreable(
        "Missing Game",
        `Unable to find game result for team with abbreviation ${selectedTeam}`,
        hasSpread,
      );
    }

    // Determine if the player picked the winner.
    // null gameResult.winner.team indicates a tie.
    const pickedWinner =
      gameResult.winner.team === null ||
      gameResult.winner.team.abbreviation === selectedTeam;

    // How far ahead the picked team finished once the spread is applied. A push
    // counts as a win, which is why this is >= rather than >.
    // `winner.by` is only signed from the picked team's side once the game is
    // final, so this value means nothing until `isCompleted`.
    const marginAgainstSpread =
      (pickedWinner ? gameResult.winner.by : -gameResult.winner.by) + spread;
    const pointValue = marginAgainstSpread >= 0 ? 1 : 0;
    debugLog("scored pick", {
      selectedTeam,
      spread,
      winnerBy: gameResult.winner.by,
      marginAgainstSpread,
      pointValue,
    });

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
      isInvalid: false,
      isCompleted: gameResult.status === GameStatus.FINAL,
      hasSpread,
    };
  });
}

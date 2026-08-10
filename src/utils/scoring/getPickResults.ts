import { GameStatus, HomeAway } from "../../types/ESPN";
import { GameScore } from "../../types/GameScore";
import { LeagueResult } from "../../types/LeagueResult";
import { Status } from "../../types/RakMadnessScores";
import parsePick from "./parsePick";

export function getStatus(score: GameScore): Status {
  if (score.wasNotFound) {
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
 * team appearing twice resolves to its earliest game, the way a linear scan did.
 */
function indexResultsByTeam(
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

export function getPickResults(
  picks: Array<string>,
  leagueResults: Array<LeagueResult>,
): Array<GameScore> {
  const resultsByTeam = indexResultsByTeam(leagueResults);

  return picks.map((pick: string) => {
    console.debug("==========");

    // Parse the pick text to extract the selected team abbreviation and spread (if present).
    const { teamAbbreviation: selectedTeam, spread } = parsePick(pick);
    console.debug("Selected Team:", selectedTeam);
    console.debug("Spread:", spread);
    const hasSpread = spread !== 0;

    // Find the game result matching the selected team.
    const gameResult =
      selectedTeam != null ? resultsByTeam.get(selectedTeam) : undefined;
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

    // How far ahead the picked team finished once the spread is applied. A push
    // counts as a win, which is why this is >= rather than >.
    // `winner.by` is only signed from the picked team's side once the game is
    // final, so this value means nothing until `isCompleted`.
    const marginAgainstSpread =
      (pickedWinner ? gameResult.winner.by : -gameResult.winner.by) + spread;
    const pointValue = marginAgainstSpread >= 0 ? 1 : 0;
    console.debug("Pick", {
      selectedTeam,
      spread,
      by: gameResult.winner.by,
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
      wasNotFound: false,
      isCompleted: gameResult.status === GameStatus.FINAL,
      hasSpread,
    };
  });
}

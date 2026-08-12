import { PlayerScore } from "../../types/RakMadnessScores";
import rangeWithPrefix from "../rangeWithPrefix";
import { MISSING_PICK } from "./getPickResults";

const LEAGUES = ["college", "pro"] as const;

const LEAGUE_PREFIX: Record<(typeof LEAGUES)[number], string> = {
  college: "C",
  pro: "P",
};

/**
 * The games nobody can be scored on, by the label the picks table gives them.
 *
 * A contradicted spread or a game the results do not hold is a hole in the week
 * itself, so a week carrying one is not finished however many of its games are.
 * A cell left blank is not one of those: it scores the player nothing and says
 * nothing about the game, and every week has some.
 */
export default function unscoreableGames(
  players: Array<PlayerScore>,
): Array<string> {
  const [first] = players;
  if (first == null) return [];
  return LEAGUES.flatMap((league) => {
    const labels = rangeWithPrefix(first[league].length, LEAGUE_PREFIX[league]);
    return first[league]
      .map((_, index) =>
        players.some(
          (player) =>
            player[league][index].status === "error" &&
            player[league][index].explanation.header !== MISSING_PICK,
        )
          ? labels[index]
          : null,
      )
      .filter((label) => label != null);
  });
}

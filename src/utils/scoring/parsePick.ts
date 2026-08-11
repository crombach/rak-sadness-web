/**
 * A cell's team abbreviation and its spread, if it carries one.
 *
 * The abbreviation may hold inner hyphens, which several college teams do (`M-OH`),
 * so the spread is anchored to the end of the cell rather than found by looking for
 * the first sign. It has to hold a letter somewhere, which is what tells an
 * abbreviation from a spread nobody put a team in front of.
 *
 * Both are read loosely, because these cells are typed by hand. A spread without a
 * sign is taken as written, and a space between the sign and the number is ignored.
 */
const pickRegex =
  /^\s*((?=[A-Za-z0-9&'.-]*[A-Za-z])[A-Za-z0-9&'.-]+?)\s*([+-]?\s*\d+(?:\.\d+)?)?\s*$/;

export default function parsePick(pickString: string) {
  const [, teamAbbreviation, spreadText] = pickRegex.exec(pickString) ?? [];
  return {
    // A blank cell reaches here as the string "undefined", and a cell holding
    // punctuation alone matches nothing. Neither names a team, and a matchup that
    // took one for a team would never find its real game.
    teamAbbreviation:
      teamAbbreviation != null && teamAbbreviation !== "undefined"
        ? teamAbbreviation.toUpperCase()
        : undefined,
    spread: spreadText != null ? Number(spreadText.replace(/\s+/g, "")) : 0,
  };
}

import debugLog from "../debugLog";
import parsePick from "./parsePick";
import findInconsistentSpreadGames from "./validateSpreads";

export const TIEBREAKER_PICK_KEY = "Pts";

export type ParsedPicks = {
  rows: Array<any>;
  collegeKeys: Array<string>;
  proKeys: Array<string>;
  /** Undefined when the sheet has no `Pts` column, so no game decides ties. */
  tiebreakerGameKey?: string;
  collegeMatchups: Array<Set<string>>;
  proMatchups: Array<Set<string>>;
  /** Game key to the disagreement, for the games that cannot be scored. */
  inconsistentSpreadGames: Map<string, string>;
};

/**
 * `xlsx-js-style` is over half the bundle, and nothing on the first paint needs
 * it, so it is fetched when a workbook actually turns up.
 */
export default async function parsePicksWorkbook(
  picksBuffer: ArrayBuffer,
): Promise<ParsedPicks> {
  const XLSX = await import("xlsx-js-style");
  const workbook = XLSX.read(picksBuffer, { type: "array" });
  const picksSheet = workbook.Sheets[Object.keys(workbook.Sheets)[0]];
  const rows: Array<any> = XLSX.utils.sheet_to_json(picksSheet);

  // From the header row, not from a player's row: `sheet_to_json` leaves a blank
  // cell out of the object it builds, so a game the first player skipped would go
  // unscored for everyone, and the tiebreaker game would shift a column.
  const [headerRow = []] = XLSX.utils.sheet_to_json<Array<string>>(picksSheet, {
    header: 1,
  });
  const allKeys = headerRow.filter((key) => key != null && key !== "");
  const collegeKeys = allKeys.filter((key) => key.startsWith("C"));
  const proKeys = allKeys.filter(
    (key) => key.startsWith("P") && key !== TIEBREAKER_PICK_KEY,
  );
  // The tiebreaker game is the last one before the tiebreaker score column.
  const tiebreakerPickIndex = allKeys.indexOf(TIEBREAKER_PICK_KEY);
  const tiebreakerGameKey =
    tiebreakerPickIndex > 0 ? allKeys[tiebreakerPickIndex - 1] : undefined;

  // Determine team matchups.
  const matchups: { [gameKey: string]: Set<string> } = {};
  rows.forEach((playerRow: any) => {
    const addToMatchups = (key: string) => {
      const { teamAbbreviation } = parsePick(playerRow[key]);
      if (teamAbbreviation == null) return;
      if (!matchups[key]) {
        matchups[key] = new Set<string>();
      }
      matchups[key].add(teamAbbreviation);
    };
    collegeKeys.forEach(addToMatchups);
    proKeys.forEach(addToMatchups);
  });
  const matchupsFor = (keys: Array<string>) =>
    keys.map((key) => matchups[key]).filter((matchup) => matchup != null);
  const collegeMatchups = matchupsFor(collegeKeys);
  const proMatchups = matchupsFor(proKeys);
  debugLog("matchups", { collegeMatchups, proMatchups });

  const inconsistentSpreadGames = findInconsistentSpreadGames(rows, [
    ...collegeKeys,
    ...proKeys,
  ]);
  // Warned about in production, not just in a dev server: it means the workbook
  // needs fixing, and only whoever published it can do that.
  inconsistentSpreadGames.forEach((reason, gameKey) => {
    console.error(`Cannot score game ${gameKey}. ${reason}`);
  });

  return {
    rows,
    collegeKeys,
    proKeys,
    tiebreakerGameKey,
    collegeMatchups,
    proMatchups,
    inconsistentSpreadGames,
  };
}

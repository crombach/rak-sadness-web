import debugLog from "../debugLog";
import parsePick from "./parsePick";
import findInconsistentSpreadGames from "./validateSpreads";

export const TIEBREAKER_PICK_KEY = "Pts";

export type ParsedPicks = {
  rows: Array<any>;
  collegeKeys: Array<string>;
  proKeys: Array<string>;
  tiebreakerGameKey: string;
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

  // Determine property keys for different game types.
  const allKeys = Object.keys(rows[0]);
  const collegeKeys = allKeys.filter((key) => key.startsWith("C"));
  const proKeys = allKeys.filter(
    (key) => key.startsWith("P") && key !== TIEBREAKER_PICK_KEY,
  );
  // The tiebreaker game key should always be the last one before the tiebreaker score pick.
  const tiebreakerGameKey = allKeys[allKeys.indexOf(TIEBREAKER_PICK_KEY) - 1];

  // Determine team matchups.
  const matchups: { [gameKey: string]: Set<string> } = {};
  rows.forEach((playerRow: any) => {
    const addToMatchups = (key: string) => {
      if (playerRow[key]) {
        const { teamAbbreviation } = parsePick(playerRow[key]);
        if (!matchups[key]) {
          matchups[key] = new Set<string>();
        }
        // A cell reading "undefined" parses to no team. Adding it would make the
        // matchup look like it has two sides, so the real game never matches.
        if (teamAbbreviation != null) {
          matchups[key].add(teamAbbreviation);
        }
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

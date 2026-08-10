import * as XLSX from "xlsx-js-style";
import debugLog from "../debugLog";
import parsePick from "./parsePick";

export const TIEBREAKER_PICK_KEY = "Pts";

export type ParsedPicks = {
  rows: Array<any>;
  collegeKeys: Array<string>;
  proKeys: Array<string>;
  tiebreakerGameKey: string;
  collegeMatchups: Array<Set<string>>;
  proMatchups: Array<Set<string>>;
};

export default function parsePicksWorkbook(
  picksBuffer: ArrayBuffer,
): ParsedPicks {
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

  return {
    rows,
    collegeKeys,
    proKeys,
    tiebreakerGameKey,
    collegeMatchups,
    proMatchups,
  };
}

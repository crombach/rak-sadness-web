import { WeekInfo } from "../types/League";
import { XLSX_CONTENT_TYPE } from "./buildSpreadsheetBuffer";
import { readCachedPicks, writeCachedPicks } from "./picksCache";

/**
 * A week's picks workbook from the API, falling back to whatever this browser
 * cached from an earlier upload. Without the fallback, reopening a results URL
 * for a week that was only ever uploaded locally would find nothing.
 */
export default async function loadStoredPicks(
  season: number,
  week: WeekInfo,
): Promise<ArrayBuffer> {
  try {
    const response = await fetch(`/api/picks/${season}/${week.value}`);
    if (response.status === 404) {
      throw new Error("Picks spreadsheet is missing from database");
    }
    // `make run` is a bare dev server with no Pages Function behind it, so it
    // answers this path with the app's own HTML at 200. Checking the type keeps
    // that page out of the workbook parser, and lets the real fetch work against
    // `npm run pages:dev`.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith(XLSX_CONTENT_TYPE)) {
      throw new Error(`Picks response was ${contentType}, not a spreadsheet`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer?.byteLength) {
      throw new Error("Empty picks buffer");
    }
    writeCachedPicks(season, week.value, arrayBuffer);
    return arrayBuffer;
  } catch (error) {
    const cached = readCachedPicks(season, week.value);
    if (cached != null) {
      return cached;
    }
    throw error;
  }
}

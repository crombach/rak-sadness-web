import { Status, RakMadnessScores } from "../types/RakMadnessScores";
import { PICK_STATUS_FILL } from "./pickStatusFill";
import rangeWithPrefix from "./rangeWithPrefix";

/** Keep in sync with the header `functions/api/picks/[year]/[week].ts` responds with. */
export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const Color = {
  WHITE: {
    rgb: "FFFFFF",
  },
  OFF_BLACK: {
    rgb: "111111",
  },
};

const Border = {
  HEADER: {
    style: "thin",
    color: Color.WHITE,
  },
  NORMAL: {
    style: "thin",
    color: Color.OFF_BLACK,
  },
};

enum CellType {
  Number = "n",
  Text = "s",
}

function headerCell(value: string) {
  return {
    v: value,
    s: {
      font: {
        bold: true,
        color: Color.WHITE,
      },
      fill: {
        patternType: "solid",
        fgColor: Color.OFF_BLACK,
      },
      border: {
        left: Border.HEADER,
        right: Border.HEADER,
        top: Border.HEADER,
        bottom: Border.HEADER,
      },
    },
  };
}

function pickCell(pick: string, isCorrect: Status) {
  const cellColor = PICK_STATUS_FILL[isCorrect];

  return {
    t: CellType.Text,
    v: pick ?? "N/A",
    s: {
      alignment: {
        horizontal: "center",
      },
      fill: {
        patternType: "solid",
        fgColor: cellColor,
      },
      border: {
        left: Border.NORMAL,
        right: Border.NORMAL,
        top: Border.NORMAL,
        bottom: Border.NORMAL,
      },
    },
  };
}

function normalCell({
  value,
  alignment = "right",
  isBold = false,
}: {
  value: string | number;
  alignment?: "right" | "left" | "center";
  isBold?: boolean;
}) {
  const cellType = typeof value === "number" ? CellType.Number : CellType.Text;
  return {
    t: cellType,
    v: value,
    s: {
      alignment: {
        horizontal: alignment,
      },
      font: {
        bold: isBold,
      },
      fill: {
        patternType: "solid",
        fgColor: Color.WHITE,
      },
      border: {
        left: Border.NORMAL,
        right: Border.NORMAL,
        top: Border.NORMAL,
        bottom: Border.NORMAL,
      },
    },
  };
}

/**
 * A tab's name, which Excel refuses past 31 characters.
 *
 * The pool's own name is left off. `Rak Madness 2025 Week 5 Results` is exactly 31
 * and week 10 is over it, and the workbook it is a tab of is already named after
 * the pool.
 */
function sheetName(season: number, week: number, view: string): string {
  return `${season} Week ${week} ${view}`;
}

/**
 * `xlsx-js-style` is over half the bundle, and an export is a deliberate click, so
 * it is fetched at that point rather than on load.
 */
export default async function buildSpreadsheetBuffer(
  scoresObject: RakMadnessScores,
  week: number,
  season: number,
): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx-js-style");
  // Create a new Excel workbook.
  const workbook = XLSX.utils.book_new();

  // Build the results sheet data as an array of arrays.
  const resultsData = [
    // Header row
    [
      headerCell("Rank"),
      headerCell("Player"),
      headerCell("MNF Points Pick"),
      headerCell("MNF Points Distance"),
      headerCell("College Score"),
      headerCell("Pro Score"),
      headerCell("Pro Score ATS"),
      headerCell("Total Score"),
    ],
    // Data rows
    ...scoresObject.scores.map((player, index) => {
      return [
        normalCell({ value: index + 1, alignment: "left", isBold: true }),
        normalCell({ value: player.name, alignment: "left" }),
        normalCell({ value: player.tiebreaker.pick ?? "N/A" }),
        normalCell({ value: player.tiebreaker.distance ?? "N/A" }),
        normalCell({ value: player.score.college }),
        normalCell({ value: player.score.pro }),
        normalCell({ value: player.score.proAgainstTheSpread }),
        normalCell({ value: player.score.total, isBold: true }),
      ];
    }),
  ];

  // Convert the scores data to a sheet.
  const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);
  // Set column widths.
  resultsSheet["!cols"] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 9 },
    { wch: 25 },
    { wch: 10 },
  ];
  // Add the results sheet to the workbook.
  XLSX.utils.book_append_sheet(
    workbook,
    resultsSheet,
    sheetName(season, week, "Results"),
  );

  // Build the picks sheet data as an array of arrays.
  const firstPlayer = scoresObject.scores[0];
  const collegeCount = firstPlayer.college.length;
  const proCount = firstPlayer.pro.length;
  const picksData = [
    // Header row
    [
      headerCell("Rank"),
      headerCell("Player"),
      ...rangeWithPrefix(collegeCount, "C").map((value) => headerCell(value)),
      headerCell("College Score"),
      ...rangeWithPrefix(proCount, "P").map((value) => headerCell(value)),
      headerCell("Pro Score"),
      headerCell("Total Score"),
    ],
    // Data rows
    ...scoresObject.scores.map((player, index) => {
      return [
        normalCell({ value: index + 1, alignment: "left", isBold: true }),
        normalCell({ value: player.name, alignment: "left" }),
        ...player.college.map((result) => pickCell(result.pick, result.status)),
        normalCell({ value: player.score.college, alignment: "center" }),
        ...player.pro.map((result) => pickCell(result.pick, result.status)),
        normalCell({ value: player.score.pro, alignment: "center" }),
        normalCell({
          value: player.score.total,
          alignment: "center",
          isBold: true,
        }),
      ];
    }),
  ];

  // Convert the picks data to a sheet.
  const picksSheet = XLSX.utils.aoa_to_sheet(picksData);
  // Set column widths.
  picksSheet["!cols"] = [
    { wch: 5 },
    { wch: 22 },
    ...rangeWithPrefix(collegeCount).map(() => ({ wch: 10 })),
    { wch: 12 },
    ...rangeWithPrefix(proCount).map(() => ({ wch: 10 })),
    { wch: 9 },
    { wch: 10 },
  ];
  // Add the results sheet to the workbook.
  XLSX.utils.book_append_sheet(
    workbook,
    picksSheet,
    sheetName(season, week, "Picks"),
  );

  // Write the workbook to a buffer and return that buffer.
  return XLSX.write(workbook, { type: "array" });
}

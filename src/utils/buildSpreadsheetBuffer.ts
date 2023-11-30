import { Correctness, RakMadnessScores } from "../types/RakMadnessScores";
import * as XLSX from "xlsx-js-style";
import rangeWithPrefix from "./rangeWithPrefix";

const Color = {
    WHITE: {
        rgb: "FFFFFF",
    },
    OFF_BLACK: {
        rgb: "111111",
    },
    GREEN: {
        rgb: "A3FAA0",
    },
    YELLOW: {
        rgb: "EDFAA0",
    },
    RED: {
        rgb: "FAA0A0",
    }
}

const Border = {
    HEADER: {
        style: "thin",
        color: Color.WHITE,
    },
    NORMAL: {
        style: "thin",
        color: Color.OFF_BLACK,
    }
}

enum CellType {
    Number = "n",
    Text = "s"
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
            }
        }
    }
}

function explanationCell(pick: string, isCorrect: Correctness) {
    // Determine cell color
    let cellColor = Color.WHITE;
    if (isCorrect === "yes") {
        cellColor = Color.GREEN;
    } else if (isCorrect === "no") {
        cellColor = Color.RED;
    } else if (isCorrect == "error") {
        cellColor = Color.YELLOW;
    }

    // Return cell object
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
            }
        }
    }
}

function normalCell({
    value,
    alignment = "right",
    isBold = false
}: {
    value: string | number;
    alignment?: "right" | "left" | "center";
    isBold?: boolean;
}) {
    const cellType = typeof (value) === "number" ? CellType.Number : CellType.Text;
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
            }
        }
    }
}

export default function buildSpreadsheetBuffer(scoresObject: RakMadnessScores, week: number): Promise<ArrayBuffer> {
    // Create a new Excel workbook.
    const workbook = XLSX.utils.book_new();

    // Build the results sheet data as an array of arrays.
    const resultsData = [
        // Header row
        [
            headerCell("Rank"),
            headerCell("Player"),
            headerCell("Tiebreaker Pick"),
            headerCell("Tiebreaker Distance"),
            headerCell("College Score"),
            headerCell("Pro Score"),
            headerCell("Pro Score Against the Spread"),
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
        })
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
    ]
    // Add the results sheet to the workbook.
    XLSX.utils.book_append_sheet(workbook, resultsSheet, `Rak Madness Week ${week} Results`);

    // Build the explanation sheet data as an array of arrays.
    const firstPlayer = scoresObject.scores[0];
    const collegeCount = firstPlayer.college.length;
    const proCount = firstPlayer.pro.length;
    const explanationData = [
        // Header row
        [
            headerCell("Rank"),
            headerCell("Player"),
            ...rangeWithPrefix(collegeCount, "C").map(value => headerCell(value)),
            headerCell("College Score"),
            ...rangeWithPrefix(proCount, "P").map(value => headerCell(value)),
            headerCell("Pro Score"),
            headerCell("Total Score")
        ],
        // Data rows
        ...scoresObject.scores.map((player, index) => {
            return [
                normalCell({ value: index + 1, alignment: "left", isBold: true }),
                normalCell({ value: player.name, alignment: "left" }),
                ...player.college.map(result => explanationCell(result.pick, result.correct)),
                normalCell({ value: player.score.college, alignment: "center" }),
                ...player.pro.map(result => explanationCell(result.pick, result.correct)),
                normalCell({ value: player.score.pro, alignment: "center" }),
                normalCell({ value: player.score.total, alignment: "center", isBold: true }),
            ];
        })
    ];

    // Convert the explanation data to a sheet.
    const explanationSheet = XLSX.utils.aoa_to_sheet(explanationData);
    // Set column widths.
    explanationSheet["!cols"] = [
        { wch: 5 },
        { wch: 22 },
        ...rangeWithPrefix(collegeCount).map(() => ({ wch: 10 })),
        { wch: 12 },
        ...rangeWithPrefix(proCount).map(() => ({ wch: 10 })),
        { wch: 9 },
        { wch: 10 }
    ]
    // Add the results sheet to the workbook.
    XLSX.utils.book_append_sheet(workbook, explanationSheet, `Rak Madness Week ${week} Explanation`);

    // Write the workbook to a buffer and return that buffer.
    return XLSX.write(workbook, { type: "array" });
}
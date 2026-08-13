import { useCallback, useState } from "react";
import { Toast, useToastActions } from "../context/ToastContext";
import { WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import buildSpreadsheetBuffer, {
  XLSX_CONTENT_TYPE,
} from "../utils/buildSpreadsheetBuffer";

/** Downloads the current scores as a workbook. */
export default function useExportScores(
  scores?: RakMadnessScores,
  week?: WeekInfo,
  season?: number,
) {
  const { showToast } = useToastActions();
  const [isExportLoading, setExportLoading] = useState(false);

  const exportResults = useCallback(() => {
    if (!week || !scores || season == null) return;
    const exportResultsAsync = async () => {
      setExportLoading(true);
      try {
        const spreadsheetBuffer = await buildSpreadsheetBuffer(
          scores,
          week.value,
          season,
        );

        const blob = new Blob([spreadsheetBuffer], {
          type: XLSX_CONTENT_TYPE,
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rak-madness_${season}_week-${week.value}_results.xlsx`;
        link.click();
        link.remove();
        // The blob is held until its URL is released, and every export mints
        // another one.
        window.URL.revokeObjectURL(url);

        showToast(
          new Toast("success", "Success", `Exported results spreadsheet`),
        );
      } catch (error) {
        console.error("Failed to export results spreadsheet", error);
        showToast(
          new Toast("danger", "Error", "Failed to export results spreadsheet."),
        );
      } finally {
        setExportLoading(false);
      }
    };
    exportResultsAsync();
  }, [scores, week, season, showToast]);

  return { exportResults, isExportLoading };
}

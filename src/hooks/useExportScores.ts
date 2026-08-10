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
) {
  const { showToast } = useToastActions();
  const [isExportLoading, setExportLoading] = useState(false);

  const exportResults = useCallback(() => {
    if (!week || !scores) return;
    const exportResultsAsync = async () => {
      setExportLoading(true);

      const spreadsheetBuffer = await buildSpreadsheetBuffer(
        scores,
        week.value,
      );

      const blob = new Blob([spreadsheetBuffer], { type: XLSX_CONTENT_TYPE });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rak-madness_week-${week.value}_scores.xlsx`;
      link.click();
      link.remove();
      // The blob is held until its URL is released, and every export mints
      // another one.
      window.URL.revokeObjectURL(url);

      setExportLoading(false);
      showToast(
        new Toast("success", "Success", `Exported results spreadsheet`),
      );
    };
    exportResultsAsync();
  }, [scores, week, showToast]);

  return { exportResults, isExportLoading };
}

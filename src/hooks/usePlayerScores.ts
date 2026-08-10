import throttle from "lodash.throttle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toast, useToastActions } from "../context/ToastContext";
import { WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import { readCachedPicks, writeCachedPicks } from "../utils/picksCache";
import { readFileToBuffer } from "../utils/readFileToBuffer";
import { getPlayerScores } from "../utils/scoring/getPlayerScores";

/** Long enough that holding the refresh button down sends one request. */
const REFRESH_THROTTLE_MS = 500;

type ScoringRequest = {
  loadPicks: () => Promise<ArrayBuffer>;
  /** Shown when the picks could not be obtained at all. */
  onLoadFailure: Toast;
  /** Shown when the picks arrived but scoring them threw. */
  onScoreFailure: Toast;
  onSuccess?: Toast;
};

/**
 * The scores for a week, however the picks arrive: from the API, from this
 * browser's cache of an earlier upload, or from a file the user just chose.
 *
 * `scoresWeek` says which week `scores` describes. Switching weeks leaves the
 * old scores in place for a moment, so anything rendering them needs to know
 * whether they are the week it asked for.
 */
export default function usePlayerScores(selectedWeek?: WeekInfo) {
  const { showToast, clearToasts } = useToastActions();

  const [picksBuffer, setPicksBuffer] = useState<ArrayBuffer>();
  const [scores, setScores] = useState<RakMadnessScores>();
  const [scoresWeek, setScoresWeek] = useState<number>();
  const [isPicksLoading, setPicksLoading] = useState(true);
  const [isScoresLoading, setScoresLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);

  // Every path into the scores runs through here, so the loading flags and the
  // failure toasts cannot drift between them.
  const attemptScoring = useCallback(
    async ({
      loadPicks,
      onLoadFailure,
      onScoreFailure,
      onSuccess,
    }: ScoringRequest) => {
      if (!selectedWeek) return;
      setPicksLoading(true);
      setScoresLoading(true);

      let buffer: ArrayBuffer;
      try {
        buffer = await loadPicks();
        setPicksBuffer(buffer);
      } catch (error) {
        console.warn(
          `Failed to load week ${selectedWeek.value} picks spreadsheet. Has it been uploaded yet?`,
          error,
        );
        setScores(undefined);
        setScoresWeek(undefined);
        setPicksLoading(false);
        setScoresLoading(false);
        showToast(onLoadFailure);
        return;
      }
      setPicksLoading(false);

      try {
        setScores(await getPlayerScores(selectedWeek, buffer));
        setScoresWeek(selectedWeek.value);
        if (onSuccess) {
          showToast(onSuccess);
        }
      } catch (error) {
        console.error("Failed to calculate scores", error);
        setScores(undefined);
        setScoresWeek(undefined);
        showToast(onScoreFailure);
      } finally {
        setScoresLoading(false);
      }
    },
    [selectedWeek, showToast],
  );

  // Fetch the week's picks from the API, falling back to whatever this browser
  // cached from an earlier upload. Without the fallback, reopening a results URL
  // for a week that was only ever uploaded locally would find nothing.
  const loadStoredPicks = useCallback(async (week: WeekInfo) => {
    try {
      // Hack to disable this feature on localhost.
      if (window.location.host.includes("localhost")) {
        throw new Error("Can't fetch picks in development environment");
      }
      const response = await fetch(`/api/picks/${week.value}`);
      if (response.status === 404) {
        throw new Error("Picks spreadsheet is missing from database");
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer?.byteLength) {
        throw new Error("Empty picks buffer");
      }
      writeCachedPicks(week.value, arrayBuffer);
      return arrayBuffer;
    } catch (error) {
      const cached = readCachedPicks(week.value);
      if (cached != null) {
        return cached;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    const scoreStoredPicks = async () =>
      attemptScoring({
        loadPicks: () => loadStoredPicks(selectedWeek),
        onLoadFailure: new Toast(
          "warning",
          "Missing Picks",
          `The picks spreadsheet for week ${selectedWeek.value} is not yet in the database, but you can use a local spreadsheet if you have one.`,
        ),
        onScoreFailure: new Toast(
          "danger",
          "Error",
          `Failed to calculate scores for week ${selectedWeek.value}.`,
        ),
      });
    scoreStoredPicks();
  }, [selectedWeek, attemptScoring, loadStoredPicks]);

  const scoreLocalFile = useCallback(
    async (file?: File) => {
      if (!selectedWeek) return;
      if (!file) {
        setScores(undefined);
        setScoresWeek(undefined);
        setScoresLoading(false);
        showToast(
          new Toast("neutral", "Info", "Aborted picks shreadsheet selection"),
        );
        return;
      }
      // A file the user picked may not be a workbook at all, so reading it and
      // scoring it fail the same way as far as they are concerned.
      const failure = new Toast(
        "danger",
        "Error",
        "Failed to read picks from the spreadsheet you selected.",
      );
      await attemptScoring({
        loadPicks: async () => {
          const buffer = await readFileToBuffer(file);
          writeCachedPicks(selectedWeek.value, buffer);
          return buffer;
        },
        onLoadFailure: failure,
        onScoreFailure: failure,
        onSuccess: new Toast(
          "success",
          "Success",
          "Generated results from picks spreadsheet",
        ),
      });
    },
    [selectedWeek, attemptScoring, showToast],
  );

  // useMemo, not useCallback: the value is throttle()'s wrapper, not the
  // function literal, so useCallback cannot see its dependencies.
  const refreshThrottled = useMemo(
    () =>
      throttle(async () => {
        if (picksBuffer == null || selectedWeek == null) return;
        setRefreshing(true);
        clearToasts();
        // Refreshing rescores the workbook already in memory, so there is no
        // separate way for loading it to fail.
        const failure = new Toast(
          "danger",
          "Error",
          `Failed to calculate scores for week ${selectedWeek.value}.`,
        );
        try {
          await attemptScoring({
            loadPicks: async () => picksBuffer,
            onLoadFailure: failure,
            onScoreFailure: failure,
            onSuccess: new Toast(
              "success",
              "Success",
              "Results successfully updated",
            ),
          });
        } finally {
          setRefreshing(false);
        }
      }, REFRESH_THROTTLE_MS),
    [picksBuffer, selectedWeek, attemptScoring, clearToasts],
  );

  const refresh = useCallback(async () => {
    if (isScoresLoading) return;
    await refreshThrottled();
  }, [isScoresLoading, refreshThrottled]);

  return {
    scores,
    scoresWeek,
    isPicksLoading,
    isScoresLoading,
    isRefreshing,
    scoreLocalFile,
    refresh,
  };
}

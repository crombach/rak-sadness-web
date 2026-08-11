import throttle from "lodash.throttle";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast, useToastActions } from "../context/ToastContext";
import { WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import { XLSX_CONTENT_TYPE } from "../utils/buildSpreadsheetBuffer";
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
 * `season` is the year the week's season started in. It names the picks in the
 * API path and the cache, and it is what the games are scored against, so a week
 * played in January still scores against the season it belongs to. Nothing is
 * attempted until it is known.
 *
 * `scoresWeek` says which week `scores` describes, and `settledWeek` says which
 * week this hook has finished trying. Switching weeks leaves the old values in
 * place for a moment, so anything reacting to a missing score has to wait for
 * `settledWeek` to catch up or it will act on the previous week's outcome.
 */
export default function usePlayerScores(
  selectedWeek?: WeekInfo,
  season?: number,
) {
  const { showToast, clearToasts } = useToastActions();

  const [picksBuffer, setPicksBuffer] = useState<ArrayBuffer>();
  const [scores, setScores] = useState<RakMadnessScores>();
  const [scoresWeek, setScoresWeek] = useState<number>();
  const [isPicksLoading, setPicksLoading] = useState(true);
  const [isScoresLoading, setScoresLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [settledWeek, setSettledWeek] = useState<number>();
  // Counts scoring attempts, so a superseded one cannot write its week's scores
  // over the week that replaced it. Two can be in flight whenever the selected
  // week changes while the first is still loading.
  const latestAttempt = useRef(0);

  const clearScores = useCallback(() => {
    setScores(undefined);
    setScoresWeek(undefined);
  }, []);

  // Every path into the scores runs through here, so the loading flags and the
  // failure toasts cannot drift between them.
  const attemptScoring = useCallback(
    async ({
      loadPicks,
      onLoadFailure,
      onScoreFailure,
      onSuccess,
    }: ScoringRequest) => {
      if (!selectedWeek || season == null) return;
      const attempt = ++latestAttempt.current;
      const isLatest = () => latestAttempt.current === attempt;
      setPicksLoading(true);
      setScoresLoading(true);

      let buffer: ArrayBuffer;
      try {
        buffer = await loadPicks();
        if (!isLatest()) return;
        setPicksBuffer(buffer);
      } catch (error) {
        if (!isLatest()) return;
        setSettledWeek(selectedWeek.value);
        console.warn(
          `Failed to load week ${selectedWeek.value} picks spreadsheet. Has it been uploaded yet?`,
          error,
        );
        clearScores();
        setPicksLoading(false);
        setScoresLoading(false);
        showToast(onLoadFailure);
        return;
      }
      setPicksLoading(false);

      try {
        const weekScores = await getPlayerScores(selectedWeek, buffer, season);
        if (!isLatest()) return;
        setScores(weekScores);
        setScoresWeek(selectedWeek.value);
        if (onSuccess) {
          showToast(onSuccess);
        }
      } catch (error) {
        if (!isLatest()) return;
        console.error("Failed to calculate scores", error);
        clearScores();
        showToast(onScoreFailure);
      } finally {
        if (isLatest()) {
          setScoresLoading(false);
          setSettledWeek(selectedWeek.value);
        }
      }
    },
    [selectedWeek, season, showToast, clearScores],
  );

  // Fetch the week's picks from the API, falling back to whatever this browser
  // cached from an earlier upload. Without the fallback, reopening a results URL
  // for a week that was only ever uploaded locally would find nothing.
  const loadStoredPicks = useCallback(
    async (seasonYear: number, week: WeekInfo) => {
      try {
        const response = await fetch(`/api/picks/${seasonYear}/${week.value}`);
        if (response.status === 404) {
          throw new Error("Picks spreadsheet is missing from database");
        }
        // `make run` is a bare dev server with no Pages Function behind it, so
        // it answers this path with the app's own HTML at 200. Checking the type
        // keeps that page out of the workbook parser, and lets the real fetch
        // work against `npm run pages:dev`.
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.startsWith(XLSX_CONTENT_TYPE)) {
          throw new Error(
            `Picks response was ${contentType}, not a spreadsheet`,
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer?.byteLength) {
          throw new Error("Empty picks buffer");
        }
        writeCachedPicks(seasonYear, week.value, arrayBuffer);
        return arrayBuffer;
      } catch (error) {
        const cached = readCachedPicks(seasonYear, week.value);
        if (cached != null) {
          return cached;
        }
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedWeek || season == null) return;
    const scoreStoredPicks = async () =>
      attemptScoring({
        loadPicks: () => loadStoredPicks(season, selectedWeek),
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
  }, [selectedWeek, season, attemptScoring, loadStoredPicks]);

  const scoreLocalFile = useCallback(
    async (file?: File) => {
      if (!selectedWeek || season == null) return;
      if (!file) {
        clearScores();
        setScoresLoading(false);
        showToast(
          new Toast("neutral", "Info", "Aborted picks spreadsheet selection"),
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
          writeCachedPicks(season, selectedWeek.value, buffer);
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
    [selectedWeek, season, attemptScoring, showToast, clearScores],
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

  // Memoized so `AppDataContext` can memoize the value it publishes.
  return useMemo(
    () => ({
      scores,
      scoresWeek,
      settledWeek,
      isPicksLoading,
      isScoresLoading,
      isRefreshing,
      scoreLocalFile,
      refresh,
    }),
    [
      scores,
      scoresWeek,
      settledWeek,
      isPicksLoading,
      isScoresLoading,
      isRefreshing,
      scoreLocalFile,
      refresh,
    ],
  );
}

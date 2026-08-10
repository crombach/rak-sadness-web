import { Refresh } from "@mui/icons-material";
import Info from "@mui/icons-material/Info";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import Leaderboard from "@mui/icons-material/Leaderboard";
import { Select } from "@base-ui-components/react/select";
import Button from "./button/Button";
import throttle from "lodash.throttle";
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toast, useToastContext } from "../context/ToastContext";
import { League, WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";
import getClasses from "../utils/getClasses";
import getLeagueInfo from "../utils/getLeagueInfo";
import { getPlayerScores, readFileToBuffer } from "../utils/getPlayerScores";
import Footer from "./footer/Footer";
import LogoButton from "./navbar/LogoButton/LogoButton";
import Navbar from "./navbar/Navbar";
import "./RakSadness.scss";
import ExplanationTable from "./table/explanation/ExplanationTable";
import ScoresTable from "./table/scores/ScoresTable";

export default function RakSadness() {
  const { showToast, clearToasts } = useToastContext();

  // Refs
  const refreshButtonRef = useRef<HTMLElement>(null);

  // Loading flags
  const [isWeekInfoLoading, setWeekInfoLoading] = useState(true);
  const [isPicksLoading, setPicksLoading] = useState(true);
  const [isScoresLoading, setScoresLoading] = useState(true);
  const [isExportLoading, setExportLoading] = useState(false);

  // File upload stuff
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Scores-related state
  const [picksBuffer, setPicksBuffer] = useState<ArrayBuffer>();
  const [scores, setScores] = useState<RakMadnessScores>();
  const [showScores, setShowScores] = useState<
    "Scoreboard" | "Explanation" | false
  >(false);

  // Week state
  const [weeks, setWeeks] = useState<Array<WeekInfo>>();
  const [currentWeek, setCurrentWeek] = useState<number>();
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo>();

  // Query the ESPN API to get the current NFL week
  useEffect(() => {
    const getLeagueInfoAsync = async () => {
      const proLeagueInfo = await getLeagueInfo(League.PRO);
      if (proLeagueInfo == null) {
        setWeekInfoLoading(false);
        showToast(
          new Toast("danger", "Error", "Failed to load the NFL schedule."),
        );
        return;
      }
      // Set to the current regular season week, or the max if it's the post- or off-season.
      setWeeks(proLeagueInfo.activeCalendar.weeks);
      setCurrentWeek(proLeagueInfo.activeWeek.value);
      setSelectedWeek(proLeagueInfo.activeWeek);
      setWeekInfoLoading(false);
    };
    getLeagueInfoAsync();
  }, [showToast]);

  const fetchPicksBuffer = useCallback(async () => {
    if (!selectedWeek) return null;
    setPicksLoading(true);
    try {
      // Hack to disable this feature on localhost.
      if (window.location.host.includes("localhost")) {
        throw new Error("Can't fetch picks in development environment");
      }
      const response = await fetch(`/api/picks/${selectedWeek.value}`);
      if (response.status === 404) {
        throw new Error("Picks spreadsheet is missing from database");
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer?.byteLength) {
        throw new Error("Empty picks buffer");
      }
      return arrayBuffer;
    } catch (error) {
      // If the picks spreadsheet doesn't exist yet, fail gracefully and log a message.
      console.warn(
        `Failed to load week ${selectedWeek.value} picks spreadsheet from API. Has it been uploaded yet?`,
        error,
      );
      setScores(undefined);
      showToast(
        new Toast(
          "warning",
          "Missing Picks",
          `The picks spreadsheet for week ${selectedWeek.value} is not yet in the database, but you can use a local spreadsheet if you have one.`,
        ),
      );
      return null;
    } finally {
      setScoresLoading(false);
      setPicksLoading(false);
    }
  }, [selectedWeek, showToast]);

  const calculateScores = useCallback(
    async (picksBuffer: ArrayBuffer) => {
      if (!selectedWeek) return;
      setScoresLoading(true);
      try {
        setScores(await getPlayerScores(selectedWeek, picksBuffer));
      } catch (error) {
        // If the scores failed to calculate, fail gracefully and log a message.
        console.error("Failed to calculate scores", error);
        setScores(undefined);
        showToast(
          new Toast(
            "danger",
            "Error",
            `Failed to calculate scores for week ${selectedWeek.value}.`,
          ),
        );
      } finally {
        setScoresLoading(false);
      }
    },
    [selectedWeek, showToast],
  );

  // When the week changes, attempt to fetch the picks spreadsheet from the API.
  useEffect(() => {
    if (selectedWeek && !isWeekInfoLoading) {
      const getDataAsync = async () => {
        const picksBuffer = await fetchPicksBuffer();
        if (picksBuffer != null) {
          setPicksBuffer(picksBuffer);
          await calculateScores(picksBuffer);
        }
      };
      getDataAsync();
    }
  }, [selectedWeek, isWeekInfoLoading, fetchPicksBuffer, calculateScores]);

  // When a user manually uploads a picks spreadsheet, parse and score it.
  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (!selectedWeek) {
        return;
      }

      const abort = () => {
        setScores(undefined);
        setScoresLoading(false);
        showToast(
          new Toast("neutral", "Info", "Aborted picks shreadsheet selection"),
        );
      };

      const scoreSpreadsheetAsync = async () => {
        setScoresLoading(true);

        // Get buffer from file.
        const files = Array.from(event.target.files ?? []);
        if (!files.length || !files[0]) {
          abort();
          return;
        }
        // Both of these reject on a file that is not a readable workbook, which
        // is whatever the user happened to pick.
        try {
          const picksBuffer = await readFileToBuffer(files[0]);
          setPicksBuffer(picksBuffer);
          const newScores = await getPlayerScores(selectedWeek, picksBuffer);
          if (!newScores) {
            abort();
            return;
          }
          setScores(newScores);
          setScoresLoading(false);
          showToast(
            new Toast(
              "success",
              "Success",
              "Generated results from picks spreadsheet",
            ),
          );
        } catch (error) {
          console.error("Failed to score the uploaded spreadsheet", error);
          setScores(undefined);
          setScoresLoading(false);
          showToast(
            new Toast(
              "danger",
              "Error",
              "Failed to read picks from the spreadsheet you selected.",
            ),
          );
        }
      };

      scoreSpreadsheetAsync();
    },
    [selectedWeek, showToast],
  );

  // Refresh the score data. Throttle so user can't spam clicks.
  // Wrapped by handleRefresh to avoid sending multiple requests
  // if first one is taking a long time.
  // useMemo, not useCallback: the value is throttle()'s wrapper, not the
  // function literal, so useCallback cannot see its dependencies.
  const doRefreshThrottled = useMemo(
    () =>
      // throttle() only stores the callback here. It runs from handleRefresh,
      // never during render, so reading the ref inside it is safe.
      // eslint-disable-next-line react-hooks/refs
      throttle(async () => {
        refreshButtonRef.current?.classList.add("--spinning");
        clearToasts();
        if (picksBuffer == null) return;
        await calculateScores(picksBuffer);
        showToast(
          new Toast("success", "Success", "Results successfully updated"),
        );
        refreshButtonRef.current?.classList.remove("--spinning");
      }, 500),
    [picksBuffer, calculateScores, clearToasts, showToast],
  );
  const handleRefresh = useCallback(async () => {
    // Short-circuit if scores are already loading.
    if (isScoresLoading) return;
    await doRefreshThrottled();
  }, [isScoresLoading, doRefreshThrottled]);

  // Export the current scores to an Excel spreadsheet file.
  const exportResults = useCallback(() => {
    if (!selectedWeek || !scores) return;
    const exportResultsAsync = async () => {
      setExportLoading(true);

      // Build the spreadsheet buffer.
      const spreadsheetBuffer = await buildSpreadsheetBuffer(
        scores,
        selectedWeek.value,
      );

      // Download the spreadsheet to the user's computer.
      const blob = new Blob([spreadsheetBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `rak-madness_week-${selectedWeek.value}_scores.xlsx`;
      link.click();
      link.remove();

      // Show success message.
      setExportLoading(false);
      showToast(
        new Toast("success", "Success", `Exported results spreadsheet`),
      );
    };
    exportResultsAsync();
  }, [scores, selectedWeek, showToast]);

  const navbarLeft = useMemo(() => {
    return !!showScores && !!scores ? (
      <>
        <LogoButton onClick={() => setShowScores(false)} />
        <span>{showScores}</span>
      </>
    ) : (
      <>
        <LogoButton onClick={() => setShowScores(false)} />
        <span>Rak Madness Scoreboard</span>
      </>
    );
  }, [showScores, scores]);

  const navbarRight = useMemo(() => {
    return !!showScores && !!scores ? (
      <>
        <Button
          onClick={() => setShowScores("Scoreboard")}
          className={`home__scores-header-button ${getClasses({
            "--active": showScores === "Scoreboard",
          })}`}
        >
          <Leaderboard />
        </Button>
        <Button
          onClick={() => setShowScores("Explanation")}
          className={`home__scores-header-button ${getClasses({
            "--active": showScores === "Explanation",
          })}`}
        >
          <Info />
        </Button>
        <div className="home__scores-header-divider" />
        <Button
          buttonRef={refreshButtonRef}
          onClick={handleRefresh}
          className="home__scores-header-button"
        >
          <Refresh />
        </Button>
      </>
    ) : null;
  }, [showScores, scores, handleRefresh]);

  return (
    <div
      className="home"
      style={{
        backgroundImage: "url(/logo512.png)",
        backgroundColor: "#6eaad9",
      }}
    >
      {/* Navbar */}
      <Navbar left={navbarLeft} right={navbarRight} />

      {/* Main Content */}
      <main
        className={`home__content ${getClasses({
          "--scores": !!showScores && !!scores,
        })}`}
      >
        {/* Home Page */}
        {!showScores && !isWeekInfoLoading && (
          <>
            {/* Input Controls */}
            <div className="home__controls">
              {/* Week number input */}
              {/*
                `value` holds the WeekInfo object itself, and Base UI compares
                with Object.is by default, so an option only reads as selected
                when it is the same object the week list handed out.
              */}
              <Select.Root
                value={selectedWeek ?? null}
                onValueChange={(week) => setSelectedWeek(week ?? undefined)}
                disabled={isWeekInfoLoading}
              >
                <Select.Trigger className="home__week-input select__trigger">
                  <Select.Value>
                    {(week: WeekInfo | null) =>
                      week?.label ?? "Select a week..."
                    }
                  </Select.Value>
                  <Select.Icon className="select__icon">
                    <UnfoldMore />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner
                    className="select__positioner"
                    sideOffset={4}
                  >
                    <Select.Popup className="select__popup">
                      {(weeks ?? [])
                        .slice(0, currentWeek)
                        .reverse()
                        .map((week) => {
                          return (
                            <Select.Item
                              key={week.value}
                              value={week}
                              className="select__item"
                            >
                              <Select.ItemText>{week.label}</Select.ItemText>
                            </Select.Item>
                          );
                        })}
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
              {/* Hidden picks file input */}
              <input
                ref={fileInputRef}
                className="home__file-input"
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
              />
              {/* Upload picks file button */}
              <Button
                className={`home__button ${getClasses({
                  "--hide":
                    isWeekInfoLoading ||
                    isPicksLoading ||
                    isScoresLoading ||
                    !!scores,
                })}`}
                onClick={clickFileInput}
                disabled={
                  !selectedWeek ||
                  isWeekInfoLoading ||
                  isPicksLoading ||
                  isScoresLoading
                }
              >
                Use Local Spreadsheet
              </Button>
              {/* Show scores button */}
              <Button
                className={`home__button --scores ${getClasses({
                  "--loading-btn":
                    isWeekInfoLoading || isPicksLoading || isScoresLoading,
                })}`}
                disabled={
                  !selectedWeek ||
                  isWeekInfoLoading ||
                  isPicksLoading ||
                  !scores ||
                  isScoresLoading
                }
                color="success"
                onClick={() => setShowScores("Scoreboard")}
              >
                View Results
              </Button>
              {/* Export results button */}
              <Button
                className={`home__button --export ${getClasses({
                  "--loading-btn":
                    isWeekInfoLoading ||
                    isPicksLoading ||
                    isScoresLoading ||
                    isExportLoading,
                })}`}
                disabled={
                  !selectedWeek ||
                  isWeekInfoLoading ||
                  isPicksLoading ||
                  !scores ||
                  isScoresLoading ||
                  isExportLoading
                }
                color="danger"
                onClick={exportResults}
              >
                Export Results
              </Button>
            </div>

            {/* Footer */}
            <Footer />
          </>
        )}

        {/* Scores Viewer */}
        {showScores && scores && (
          <div className="home__scores">
            {showScores === "Scoreboard" && <ScoresTable scores={scores} />}
            {showScores === "Explanation" && (
              <ExplanationTable scores={scores} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

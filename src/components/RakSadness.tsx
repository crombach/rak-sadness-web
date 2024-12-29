import { Refresh } from "@mui/icons-material";
import Info from "@mui/icons-material/Info";
import Leaderboard from "@mui/icons-material/Leaderboard";
import { Button, Option, Select, Sheet } from "@mui/joy";
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
import { League } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";
import getClasses from "../utils/getClasses";
import getLeagueInfo from "../utils/getLeagueInfo";
import { getPlayerScores, readFileToBuffer } from "../utils/getPlayerScores";
import { WEEKS_PRO_REGULAR_SEASON } from "../utils/weeks";
import Footer from "./footer/Footer";
import LogoButton from "./navbar/LogoButton/LogoButton";
import Navbar from "./navbar/Navbar";
import "./RakSadness.scss";
import ExplanationTable from "./table/explanation/ExplanationTable";
import ScoresTable from "./table/scores/ScoresTable";

export default function RakSadness() {
  const { showToast, clearToasts } = useToastContext();

  // Refs
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  // Loading flags
  const [isCurrentWeekLoading, setCurrentWeekLoading] = useState(true);
  const [isPicksLoading, setPicksLoading] = useState(true);
  const [isScoresLoading, setScoresLoading] = useState(true);
  const [isExportLoading, setExportLoading] = useState(false);

  // File upload stuff
  const fileInputRef = useRef(null);
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
  const [currentWeek, setCurrentWeek] = useState<number>();
  const [selectedWeek, setSelectedWeek] = useState<number>();

  // Query the ESPN API to get the current NFL week
  useEffect(() => {
    const getLeagueInfoAsync = async () => {
      const leagueInfo = await getLeagueInfo(League.PRO);
      // Set to the current regular season week, or the max if it's the post- or off-season.
      const week =
        leagueInfo.activeWeek.value ||
        leagueInfo.activeCalendar?.weeks.length ||
        WEEKS_PRO_REGULAR_SEASON;
      setCurrentWeek(week);
      setSelectedWeek(week);
      setCurrentWeekLoading(false);
    };
    getLeagueInfoAsync();
  }, []);

  const fetchPicksBuffer = async () => {
    setPicksLoading(true);
    try {
      // Hack to disable this feature on localhost.
      if (window.location.host.includes("localhost")) {
        throw new Error("Can't fetch picks in development environment");
      }
      const response = await fetch(`/api/picks/${selectedWeek}`);
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
        `Failed to load week ${selectedWeek} picks spreadsheet from API. Has it been uploaded yet?`,
        error,
      );
      setScores(null);
      showToast(
        new Toast(
          "warning",
          "Missing Picks",
          `The picks spreadsheet for week ${selectedWeek} is not yet in the database, but you can use a local spreadsheet if you have one.`,
        ),
      );
      return null;
    } finally {
      setScoresLoading(false);
      setPicksLoading(false);
    }
  };

  const calculateScores = async (picksBuffer: ArrayBuffer) => {
    setScoresLoading(true);
    try {
      setScores(await getPlayerScores(Number(selectedWeek), picksBuffer));
    } catch (error) {
      // If the scores failed to calculate, fail gracefully and log a message.
      console.error("Failed to calculate scores", error);
      setScores(null);
      showToast(
        new Toast(
          "danger",
          "Error",
          `Failed to calculate scores for week ${selectedWeek}.`,
        ),
      );
    } finally {
      setScoresLoading(false);
    }
  };

  // When the week changes, attempt to fetch the picks spreadsheet from the API.
  useEffect(() => {
    if (selectedWeek && !isCurrentWeekLoading) {
      const getDataAsync = async () => {
        const picksBuffer = await fetchPicksBuffer();
        if (picksBuffer != null) {
          setPicksBuffer(picksBuffer);
          await calculateScores(picksBuffer);
        }
      };
      getDataAsync();
    }
  }, [selectedWeek, isCurrentWeekLoading]);

  // When a user manually uploads a picks spreadsheet, parse and score it.
  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (!selectedWeek) {
        return;
      }

      const abort = () => {
        setScores(null);
        setScoresLoading(false);
        showToast(
          new Toast("neutral", "Info", "Aborted picks shreadsheet selection"),
        );
      };

      const scoreSpreadsheetAsync = async () => {
        setScoresLoading(true);

        // Get buffer from file.
        const files = Array.from(event.target.files);
        if (!files.length || !files[0]) {
          abort();
          return;
        }
        const picksBuffer = await readFileToBuffer(files[0]);
        setPicksBuffer(picksBuffer);
        const newScores = await getPlayerScores(
          Number(selectedWeek),
          picksBuffer,
        );
        if (newScores) {
          setScores(newScores);
          setScoresLoading(false);
          showToast(
            new Toast(
              "success",
              "Success",
              "Generated results from picks spreadsheet",
            ),
          );
        } else {
          abort();
        }
      };

      scoreSpreadsheetAsync();
    },
    [selectedWeek],
  );

  // Refresh the score data. Throttle so user can't spam clicks.
  // Wrapped by handleRefresh to avoid sending multiple requests
  // if first one is taking a long time.
  const doRefreshThrottled = useCallback(
    throttle(async () => {
      refreshButtonRef.current?.classList.add("--spinning");
      clearToasts();
      await calculateScores(picksBuffer);
      showToast(
        new Toast("success", "Success", "Results successfully updated"),
      );
      refreshButtonRef.current?.classList.remove("--spinning");
    }, 500),
    [picksBuffer],
  );
  const handleRefresh = useCallback(async () => {
    // Short-circuit if scores are already loading.
    if (isScoresLoading) return;
    await doRefreshThrottled();
  }, [isScoresLoading, doRefreshThrottled]);

  // Export the current scores to an Excel spreadsheet file.
  const exportResults = useCallback(() => {
    if (!selectedWeek) return;
    const exportResultsAsync = async () => {
      setExportLoading(true);

      // Build the spreadsheet buffer.
      const spreadsheetBuffer = await buildSpreadsheetBuffer(
        scores,
        Number(selectedWeek),
      );

      // Download the spreadsheet to the user's computer.
      const blob = new Blob([spreadsheetBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `rak-madness_week-${selectedWeek}_scores.xlsx`;
      link.click();
      link.remove();

      // Show success message.
      setExportLoading(false);
      showToast(
        new Toast("success", "Success", `Exported results spreadsheet`),
      );
    };
    exportResultsAsync();
  }, [scores, selectedWeek]);

  const navbarLeft = useMemo(() => {
    <>
      <LogoButton onClick={() => setShowScores(false)} />
      <span>{showScores}</span>
    </>;
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
          variant="solid"
          color="primary"
          onClick={() => setShowScores("Scoreboard")}
          className={`home__scores-header-button ${getClasses({
            "--active": showScores === "Scoreboard",
          })}`}
        >
          <Leaderboard />
        </Button>
        <Button
          variant="solid"
          color="primary"
          onClick={() => setShowScores("Explanation")}
          className={`home__scores-header-button ${getClasses({
            "--active": showScores === "Explanation",
          })}`}
        >
          <Info />
        </Button>
        <div className="home__scores-header-divider" />
        <Button
          ref={refreshButtonRef}
          variant="solid"
          color="primary"
          onClick={handleRefresh}
          className="home__scores-header-button"
        >
          <Refresh />
        </Button>
      </>
    ) : null;
  }, [showScores, scores]);

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
      <Sheet
        className={`home__content ${getClasses({
          "--scores": !!showScores && !!scores,
        })}`}
        variant="plain"
        color="neutral"
      >
        {/* Home Page */}
        {!showScores && !isCurrentWeekLoading && (
          <>
            {/* Input Controls */}
            <div className="home__controls">
              {/* Week number input */}
              <Select
                className="home__week-input"
                placeholder="Select a week..."
                value={selectedWeek}
                onChange={(_, value) => setSelectedWeek(value)}
                disabled={isCurrentWeekLoading}
              >
                {Array.from({ length: currentWeek }, (_, i) => i + 1)
                  .reverse()
                  .map((weekNumber) => {
                    return (
                      <Option key={weekNumber} value={weekNumber}>
                        Week {weekNumber}
                      </Option>
                    );
                  })}
              </Select>
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
                    isCurrentWeekLoading ||
                    isPicksLoading ||
                    isScoresLoading ||
                    !!scores,
                })}`}
                variant="solid"
                color="primary"
                onClick={clickFileInput}
                disabled={
                  !selectedWeek ||
                  isCurrentWeekLoading ||
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
                    isCurrentWeekLoading || isPicksLoading || isScoresLoading,
                })}`}
                disabled={
                  !selectedWeek ||
                  isCurrentWeekLoading ||
                  isPicksLoading ||
                  !scores ||
                  isScoresLoading
                }
                variant="solid"
                color="success"
                onClick={() => setShowScores("Scoreboard")}
              >
                View Results
              </Button>
              {/* Export results button */}
              <Button
                className={`home__button --export ${getClasses({
                  "--loading-btn":
                    isCurrentWeekLoading ||
                    isPicksLoading ||
                    isScoresLoading ||
                    isExportLoading,
                })}`}
                disabled={
                  !selectedWeek ||
                  isCurrentWeekLoading ||
                  isPicksLoading ||
                  !scores ||
                  isScoresLoading ||
                  isExportLoading
                }
                variant="solid"
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
      </Sheet>
    </div>
  );
}

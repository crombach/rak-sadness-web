import Home from "@mui/icons-material/Home";
import Info from "@mui/icons-material/Info";
import Leaderboard from "@mui/icons-material/Leaderboard";
import { Button, Option, Select, Sheet } from "@mui/joy";
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toast, useToastContext } from "../context/ToastContext";
import { League, SeasonType } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";
import getClasses from "../utils/getClasses";
import getCurrentWeekInfo from "../utils/getCurrentWeekInfo";
import { getPlayerScores, readFileToBuffer } from "../utils/getPlayerScores";
import Navbar from "./navbar/Navbar";
import ExplanationTable from "./table/explanation/ExplanationTable";
import ScoresTable from "./table/scores/ScoresTable";
import Footer from "./footer/Footer";
import "./RakSadness.scss";

export default function RakSadness() {
  const { showToast } = useToastContext();

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
  const [scores, setScores] = useState<RakMadnessScores>();
  const [showScores, setShowScores] = useState<
    "Scoreboard" | "Explanation" | false
  >(false);

  // Week state
  const [currentWeek, setCurrentWeek] = useState<number>();
  const [selectedWeek, setSelectedWeek] = useState<number>();

  // Query the ESPN API to get the current NFL week
  useEffect(() => {
    const getWeekAsync = async () => {
      const weekInfo = await getCurrentWeekInfo(League.PRO);
      // There are 18 weeks in the NFL regular season, so limit to 18 weeks in Rak Madness.
      // If it's the offseason, show weeks 1 through 18.
      const week =
        Number(weekInfo.seasonType) === SeasonType.REGULAR
          ? weekInfo.value
          : 18;
      setCurrentWeek(week);
      setSelectedWeek(week);
      setCurrentWeekLoading(false);
    };
    getWeekAsync();
  }, []);

  // When the week changes, attempt to fetch the picks spreadsheet from the API.
  useEffect(() => {
    const fetchPicksAsync = async () => {
      if (selectedWeek && !isCurrentWeekLoading) {
        setPicksLoading(true);
        try {
          const response = await fetch(`/api/picks/${selectedWeek}`);
          response.headers;
          const picksBuffer = await response.arrayBuffer();
          setPicksLoading(false);
          setScoresLoading(true);
          const newScores = await getPlayerScores(
            Number(selectedWeek),
            picksBuffer,
          );
          setScores(newScores);
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
              `Picks sheet for week ${selectedWeek} is not yet in the database, but you can upload it manually.`,
            ),
          );
        } finally {
          setPicksLoading(false);
          setScoresLoading(false);
        }
      }
    };
    fetchPicksAsync();
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
      <Button
        variant="solid"
        color="primary"
        onClick={() => setShowScores(false)}
      >
        <Home />
      </Button>
      <span>{showScores}</span>
    </>;
    return !!showScores && !!scores ? (
      <>
        <Button
          variant="solid"
          color="primary"
          onClick={() => setShowScores(false)}
        >
          <Home />
        </Button>
        <span>{showScores}</span>
      </>
    ) : (
      <>
        <img className="navbar__logo" src="/logo192.png" />
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
                Upload Picks Spreadsheet
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

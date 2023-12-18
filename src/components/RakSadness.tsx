import { Button, Sheet } from "@mui/joy";
import {
  ChangeEventHandler,
  useCallback,
  useRef,
  useState,
  useEffect,
  ChangeEvent,
} from "react";
import { Toast, useToastContext } from "../context/ToastContext";
import { RakMadnessScores } from "../types/RakMadnessScores";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import Info from "@mui/icons-material/Info";
import Leaderboard from "@mui/icons-material/Leaderboard";
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";
import getClasses from "../utils/getClasses";
import { getPlayerScores, readFileToBuffer } from "../utils/getPlayerScores";
import getWeek from "../utils/getWeek";
import FloatingLabelInput from "./floatingLabelInput/FloatingLabelInput";
import ScoresTable from "./table/scores/ScoresTable";
import ExplanationTable from "./table/explanation/ExplanationTable";
import "./RakSadness.css";
import { useDebounce } from "usehooks-ts";

export default function RakSadness() {
  const { showToast } = useToastContext();

  // Loading flags
  const [isFirstLoad, setFirstLoad] = useState(true);
  const [isWeekLoading, setWeekLoading] = useState(true);
  const [isScoresLoading, setScoresLoading] = useState(true);
  const [isUploadLoading, setUploadLoading] = useState(false);
  const [isExportLoading, setExportLoading] = useState(false);

  // File upload stuff
  const fileInputRef = useRef(null);
  const clickFileInput = useCallback(() => {
    fileInputRef.current?.click();
    setUploadLoading(true);
  }, []);

  // Scores-related state
  const [scores, setScores] = useState<RakMadnessScores>();
  const [showScores, setShowScores] = useState<
    "Leaderboard" | "Explanation" | false
  >(false);

  // Selected week
  const [week, setWeek] = useState<string>("");
  const weekDebounced = useDebounce<string>(week, 500);

  // Query the ESPN API to get the current NFL week
  useEffect(() => {
    const getWeekAsync = async () => {
      const currentWeek = ((await getWeek()) ?? "").toString();
      setWeek(currentWeek);
      setWeekLoading(false);
    };
    getWeekAsync();
  }, []);

  // When the week changes, attempt to fetch the picks spreadsheet from the API.
  useEffect(() => {
    const fetchPicksAsync = async () => {
      if (weekDebounced) {
        setScoresLoading(true);
        try {
          const response = await fetch(`/api/picks/${weekDebounced}`);
          response.headers;
          const picksBuffer = await response.arrayBuffer();
          const newScores = await getPlayerScores(
            Number(weekDebounced),
            picksBuffer,
          );
          setScores(newScores);
          setFirstLoad(false);
        } catch (error) {
          // If the picks spreadsheet doesn't exist yet, fail gracefully and log a message.
          console.warn(
            `Failed to load week ${week} picks spreadsheet from API. Has it been uploaded yet?`,
            error,
          );
          showToast(
            new Toast(
              "warning",
              "Missing Picks",
              `Picks sheet for week ${week} is not yet in the database, but you can upload it manually.`,
            ),
          );
        } finally {
          setScoresLoading(false);
        }
      }
    };
    fetchPicksAsync();
  }, [weekDebounced]);

  // Whenever the week input value changes, update the component state.
  const handleWeekInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setScores(null);
      setScoresLoading(true);
      const digitsRegex = /^[0-9\b]+$/;
      if (event.target.value === "" || digitsRegex.test(event.target.value)) {
        setWeek(event.target.value);
      }
    },
    [],
  );

  // When a user manually uploads a picks spreadsheet, parse and score it.
  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setUploadLoading(false);
      if (!week) {
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
        const newScores = await getPlayerScores(Number(week), picksBuffer);
        if (newScores) {
          setScores(newScores);
          setScoresLoading(false);
          setFirstLoad(false);
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
    [week],
  );

  // Export the current scores to an Excel spreadsheet file.
  const exportResults = useCallback(() => {
    if (!week) return;
    const exportResultsAsync = async () => {
      setExportLoading(true);

      // Build the spreadsheet buffer.
      const spreadsheetBuffer = await buildSpreadsheetBuffer(
        scores,
        Number(week),
      );

      // Download the spreadsheet to the user's computer.
      const blob = new Blob([spreadsheetBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `rak-madness_week-${week}_scores.xlsx`;
      link.click();
      link.remove();

      // Show success message.
      setExportLoading(false);
      showToast(
        new Toast("success", "Success", `Exported results spreadsheet`),
      );
    };
    exportResultsAsync();
  }, [scores, week]);

  return (
    <Sheet className="home" variant="plain" color="neutral">
      {/* Home Page */}
      {!showScores && (
        <>
          {/* Input Controls */}
          <div className="home__controls">
            {/* Week number input */}
            <div className="home__week-input">
              <FloatingLabelInput
                label="Week"
                placeholder="Rak Madness week number"
                disabled={isWeekLoading}
                value={week}
                onChange={handleWeekInputChange}
              />
            </div>
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
                "--hide": isWeekLoading || isScoresLoading || !!scores,
                "--loading-btn": isUploadLoading,
              })}`}
              variant="solid"
              color="primary"
              onClick={clickFileInput}
              disabled={!week || isWeekLoading || isScoresLoading}
            >
              Upload Picks Spreadsheet
            </Button>
            {/* Show scores button */}
            <Button
              className={`home__button ${getClasses({
                "--loading-btn": isScoresLoading,
              })}`}
              disabled={!week || isWeekLoading || !scores || isScoresLoading}
              variant="solid"
              color="success"
              onClick={() => setShowScores("Leaderboard")}
            >
              View Results
            </Button>
            {/* Export results button */}
            <Button
              className={`home__button ${getClasses({
                "--loading-btn": isScoresLoading || isExportLoading,
              })}`}
              disabled={!week || isWeekLoading || !scores || isScoresLoading}
              variant="solid"
              color="danger"
              onClick={exportResults}
            >
              Export Results
            </Button>
          </div>

          {/* Footer */}
          <a
            className="home__footer"
            href="https://give.translifeline.org/give/461718/#!/donation/checkout"
            target="_blank"
          >
            Trans rights are human rights 🏳️‍⚧️
          </a>
        </>
      )}

      {/* Scores Viewer */}
      {showScores && scores && (
        <div className="home__scores">
          {/* Header */}
          <Sheet
            className="home__scores-header"
            variant="solid"
            color="primary"
          >
            <div className="home__scores-header-content">
              <div className="home__scores-header-left">
                <Button
                  variant="solid"
                  color="primary"
                  onClick={() => setShowScores(false)}
                >
                  <ChevronLeft />
                </Button>
                <span>{showScores}</span>
              </div>
              <div className="home__scores-header-right">
                <Button
                  variant="solid"
                  color="primary"
                  onClick={() => setShowScores("Leaderboard")}
                  className={`home__scores-header-button ${getClasses({
                    "--selected": showScores === "Leaderboard",
                  })}`}
                >
                  <Leaderboard />
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={() => setShowScores("Explanation")}
                  className={`home__scores-header-button ${getClasses({
                    "--selected": showScores === "Explanation",
                  })}`}
                >
                  <Info />
                </Button>
              </div>
            </div>
          </Sheet>

          {/* Table */}
          <div className="home__scores-content">
            {showScores === "Leaderboard" && <ScoresTable scores={scores} />}
            {showScores === "Explanation" && (
              <ExplanationTable scores={scores} />
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

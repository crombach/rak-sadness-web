import { Button, Sheet } from "@mui/joy";
import { ChangeEventHandler, useCallback, useRef, useState } from "react";
import { Toast, useToastContext } from "../context/ToastContext";
import { RakMadnessScores } from "../types/RakMadnessScores";
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Info from '@mui/icons-material/Info';
import Leaderboard from '@mui/icons-material/Leaderboard';
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";
import getClasses from "../utils/getClasses";
import getPlayerScores from "../utils/getPlayerScores";
import "./RakSadness.css";
import FloatingLabelInput from "./floatingLabelInput/FloatingLabelInput";
import ScoresTable from "./table/scores/ScoresTable";
import ExplanationTable from "./table/explanation/ExplanationTable";

export default function RakSadness() {
    const { showToast } = useToastContext();

    // File input ref
    const fileInputRef = useRef(null);

    // User input state
    const [week, setWeek] = useState<string>("");
    const [showScores, setShowScores] = useState<"leaderboard" | "explanation" | false>(false);

    // Calculated scores
    const [scores, setScores] = useState<RakMadnessScores>();

    // Loading flags
    const [isScoresLoading, setScoresLoading] = useState(false);
    const [isViewLoading/* , setViewLoading */] = useState(false);
    const [isExportLoading, setExportLoading] = useState(false);

    const clickFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        if (!week) {
            return;
        }

        const abort = () => {
            setScores(null);
            setScoresLoading(false);
            showToast(new Toast("neutral", "Info", "Aborted picks shreadsheet selection"));
        };

        const scoreSpreadsheetAsync = async () => {
            setScoresLoading(true);

            // Get buffer from file.
            const files = Array.from(event.target.files);
            if (!files.length || !files[0]) {
                abort();
                return;
            }

            const newScores = await getPlayerScores(Number(week), files[0]);
            if (newScores) {
                setScores(newScores);
                setScoresLoading(false);
                showToast(new Toast("success", "Success", "Generated results from picks spreadsheet"));
            } else {
                abort();
            }
        };

        scoreSpreadsheetAsync();
    }, [week]);


    const exportResults = useCallback(() => {
        if (!week) return;
        const exportResultsAsync = async () => {
            setExportLoading(true);

            // Build the spreadsheet buffer.
            const spreadsheetBuffer = await buildSpreadsheetBuffer(scores, Number(week));

            // Download the spreadsheet to the user's computer.
            const blob = new Blob([spreadsheetBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = `rak-madness_week-${week}_scores.xlsx`;
            link.click();
            link.remove();

            // Show success message.
            setExportLoading(false);
            showToast(new Toast("success", "Success", `Exported results spreadsheet`));
        };
        exportResultsAsync();
    }, [scores, week]);

    return (
        <Sheet className="home" variant="plain" color="neutral">
            {/* Home Page */}
            {!showScores && <>
                {/* Input Controls */}
                <div className="home__controls">
                    <div className="home__week-input">
                        <FloatingLabelInput
                            label="Week"
                            placeholder="Rak Madness week number"
                            value={week}
                            onChange={(event) => {
                                setScores(null);
                                const digitsRegex = /^[0-9\b]+$/;
                                if (event.target.value === "" || digitsRegex.test(event.target.value)) {
                                    setWeek(event.target.value);
                                }
                            }}
                        />
                    </div>
                    <input ref={fileInputRef} className="home__file-input" type="file" accept=".xlsx" onChange={handleFileUpload} />
                    <Button
                        className={`home__submit-button ${getClasses({
                            "--loading-btn": isScoresLoading
                        })}`}
                        variant="solid"
                        onClick={clickFileInput}
                        disabled={!week}
                    >
                        Select Picks Spreadsheet
                    </Button>
                    <div className={`home__actions ${getClasses({
                        "--expanded": !!week && !!scores
                    })}`}>
                        <Button
                            className={`home__actions-button ${getClasses({
                                "--loading-btn": isViewLoading
                            })}`}
                            disabled={!week || !scores || isScoresLoading}
                            variant="solid"
                            color="success"
                            onClick={() => setShowScores("leaderboard")}
                        >
                            View Results
                        </Button>
                        <Button
                            className={`home__actions-button ${getClasses({
                                "--loading-btn": isExportLoading
                            })}`}
                            disabled={!week || !scores || isScoresLoading}
                            variant="solid"
                            color="danger"
                            onClick={exportResults}
                        >
                            Export Results
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <a className="home__footer" href="https://give.translifeline.org/give/461718/#!/donation/checkout" target="_blank">Trans rights are human rights 🏳️‍⚧️</a>
            </>}

            {/* Scores Viewer */}
            {showScores && scores && <div className="home__scores">
                {/* Header */}
                <Sheet className="home__scores-header" variant="solid" color="primary">
                    <div className="home__scores-header-content">
                        <div className="home__scores-header-left">
                            <Button
                                variant="solid"
                                color="primary"
                                onClick={() => setShowScores(false)}
                            >
                                <ChevronLeft />
                            </Button>
                            <span>{showScores === "leaderboard" ? "Leaderboard" : "Explanation"}</span>
                        </div>
                        <div className="home__scores-header-right">
                            <Button
                                variant="solid"
                                color="primary"
                                onClick={() => setShowScores("leaderboard")}
                            >
                                <Leaderboard />
                            </Button>
                            <Button
                                variant="solid"
                                color="primary"
                                onClick={() => setShowScores("explanation")}
                            >
                                <Info />
                            </Button>
                        </div>
                    </div>
                </Sheet>

                {/* Table */}
                <div className="home__scores-content">
                    {showScores === "leaderboard" && <ScoresTable scores={scores} />}
                    {showScores === "explanation" && <ExplanationTable scores={scores} />}
                </div>
            </div>}
        </Sheet>
    );

}
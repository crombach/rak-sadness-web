import { Button, Sheet } from "@mui/joy";
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Toast, useToastContext } from "../context/ToastContext";
import { RakMadnessScores } from "../types/RakMadnessScores";
import getClasses from "../utils/getClasses";
import getPlayerScores from "../utils/getPlayerScores";
import "./RakSadness.css";
import FloatingLabelInput from "./floatingLabelInput/FloatingLabelInput";

export default function RakSadness() {
    const { showToast } = useToastContext();

    // File input ref
    const fileInputRef = useRef(null);

    // User input state
    const [week, setWeek] = useState<string>("");

    // Calculated scores
    const [scores, setScores] = useState<RakMadnessScores>();

    // Loading flags
    const [isScoresLoading, setScoresLoading] = useState(false);
    const [isViewLoading/* , setViewLoading */] = useState(false);
    const [isExportLoading, setExportLoading] = useState(false);

    // Set document title
    useEffect(() => {
        document.title = "Rak Sadness"
    }, []);

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
            // TODO: Implement for web
            // const savedFile = await window.saveResultsSpreadsheet(scores, Number(week));
            const savedFile = "TODO: Implement";
            setExportLoading(false);
            showToast(new Toast("success", "Success", `Exported results to ${savedFile}`));
        };
        exportResultsAsync();
    }, [scores, week]);

    return (
        <Sheet className="home" variant="plain" color="neutral">
            <div className="home__content">
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
                <input ref={fileInputRef} className="home__file-input" type="file" onChange={handleFileUpload} />
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
                        disabled
                        // disabled={!week || !scores || isScoresLoading}
                        variant="solid"
                        color="success"
                        onClick={() => console.log("TODO: Implement View Results")}
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
            <a className="home__footer" href="https://give.translifeline.org/give/461718/#!/donation/checkout" target="_blank">Trans rights are human rights 🏳️‍⚧️</a>
        </Sheet>
    );

}
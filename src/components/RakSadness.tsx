import { Button, Sheet } from "@mui/joy";
import { useCallback, useEffect, useState } from "react";
import { RakMadnessScores } from "../types/RakMadnessScores";
import getClasses from "../utils/getClasses";
import FloatingLabelInput from "./floatingLabelInput/FloatingLabelInput";
import { Toast, useToastContext } from "../context/ToastContext";
import "./RakSadness.css";

export default function RakSadness() {
    const { showToast } = useToastContext();

    const [week, setWeek] = useState<string>("");

    // Loading flags
    const [isScoresLoading, setScoresLoading] = useState(false);
    const [isViewLoading/* , setViewLoading */] = useState(false);
    const [isExportLoading, setExportLoading] = useState(false);

    // Set document title
    useEffect(() => {
        document.title = "Rak Sadness"
    }, []);

    const [scores, setScores] = useState<RakMadnessScores>();
    const scoreSpreadsheet = useCallback(() => {
        if (!week) return;
        const scoreSpreadsheetAsync = async () => {
            setScoresLoading(true);
            // TODO: Implement for web
            // const newScores = await window.pickAndScoreSpreadsheet(Number(week));
            const newScores: RakMadnessScores = {
                tiebreaker: 0,
                scores: [],
            }
            if (newScores) {
                setScores(newScores);
                setScoresLoading(false);
                showToast(new Toast("success", "Success", "Generated results from picks spreadsheet"));
            } else {
                setScores(null);
                setScoresLoading(false);
                showToast(new Toast("neutral", "Info", "Aborted picks shreadsheet selection"));
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
                <Button
                    className={`home__submit-button ${getClasses({
                        "--loading-btn": isScoresLoading
                    })}`}
                    variant="solid"
                    onClick={scoreSpreadsheet}
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
import { Select } from "@base-ui-components/react/select";
import { UnfoldMoreIcon } from "../icon/Icon";
import { ChangeEventHandler, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useAppData } from "../../context/AppDataContext";
import useExportScores from "../../hooks/useExportScores";
import { WeekInfo } from "../../types/League";
import getClasses from "../../utils/getClasses";
import Button from "../button/Button";
import Footer from "../footer/Footer";
import LogoButton from "../navbar/LogoButton/LogoButton";
import PageLayout, { APP_NAME } from "../PageLayout";
import "./HomePage.scss";

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectableWeeks,
    selectedWeek,
    setSelectedWeek,
    isWeekInfoLoading,
    scores,
    isPicksLoading,
    isScoresLoading,
    scoreLocalFile,
  } = useAppData();
  const { exportResults, isExportLoading } = useExportScores(
    scores,
    selectedWeek,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      scoreLocalFile(Array.from(event.target.files ?? [])[0]);
    },
    [scoreLocalFile],
  );

  // Anything that has to finish before the controls mean anything.
  const isBusy = isWeekInfoLoading || isPicksLoading || isScoresLoading;
  const hasNoScoresYet = !selectedWeek || isBusy || !scores;

  return (
    <PageLayout
      navbarLeft={
        <>
          <LogoButton onClick={() => navigate("/")} />
          <span>{APP_NAME}</span>
        </>
      }
    >
      {!isWeekInfoLoading && (
        <>
          <div className="home__controls">
            {/*
              `value` holds the WeekInfo object itself, and Base UI compares with
              Object.is by default, so an option only reads as selected when it is
              the same object the week list handed out.
            */}
            <Select.Root
              value={selectedWeek ?? null}
              onValueChange={(week) => setSelectedWeek(week ?? undefined)}
              disabled={isWeekInfoLoading}
            >
              <Select.Trigger className="home__week-input select__trigger">
                <Select.Value>
                  {(week: WeekInfo | null) => week?.label ?? "Select a week..."}
                </Select.Value>
                <Select.Icon className="select__icon">
                  <UnfoldMoreIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  className="select__positioner"
                  sideOffset={4}
                >
                  <Select.Popup className="select__popup">
                    {selectableWeeks.map((week) => (
                      <Select.Item
                        key={week.value}
                        value={week}
                        className="select__item"
                      >
                        <Select.ItemText>{week.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>

            {/* Hidden behind the button below, which forwards the click. */}
            <input
              ref={fileInputRef}
              className="home__file-input"
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
            />
            <Button
              className={`home__button ${getClasses({
                "--hide": isBusy || !!scores,
              })}`}
              onClick={clickFileInput}
              disabled={!selectedWeek || isBusy}
            >
              Use Local Spreadsheet
            </Button>
            <Button
              className={`home__button --scores ${getClasses({
                "--loading-btn": isBusy,
              })}`}
              disabled={hasNoScoresYet}
              color="success"
              onClick={() =>
                navigate(`/week/${selectedWeek?.value}/scoreboard`)
              }
            >
              View Results
            </Button>
            <Button
              className={`home__button --export ${getClasses({
                "--loading-btn": isBusy || isExportLoading,
              })}`}
              disabled={hasNoScoresYet || isExportLoading}
              color="danger"
              onClick={exportResults}
            >
              Export Results
            </Button>
          </div>

          <Footer />
        </>
      )}
    </PageLayout>
  );
}

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
import PageLayout from "../PageLayout";
import "./HomePage.scss";

/** Title case, to read like the week labels ESPN sends. */
const seasonLabel = (season: number) => `${season} Season`;

export default function HomePage() {
  const navigate = useNavigate();
  const {
    selectableWeeks,
    selectedWeek,
    setSelectedWeek,
    selectableSeasons,
    seasonYear,
    requestedSeason,
    setSelectedSeason,
    isWeekInfoLoading,
    scores,
    isScoresLoading,
    scoreLocalFile,
  } = useAppData();
  const { exportResults, isExportLoading } = useExportScores(
    scores,
    selectedWeek,
    seasonYear,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      scoreLocalFile(Array.from(event.target.files ?? [])[0]);
      // Cleared so picking the same file again still fires a change event.
      event.target.value = "";
    },
    [scoreLocalFile],
  );

  // Anything that has to finish before the controls mean anything. The week
  // lookup waits on the season list, so its flag covers that too.
  const isBusy = isWeekInfoLoading || isScoresLoading;
  const hasNoScoresYet = !selectedWeek || isBusy || !scores;

  return (
    <PageLayout
      title="Rak Madness"
      navbarLeft={<LogoButton onClick={() => navigate("/")} />}
    >
      {/*
        Only the first load hides the controls. Switching seasons disables them
        instead, so the picker the user just used does not vanish under them.
      */}
      {seasonYear != null && (
        <>
          <div className="home__controls">
            {/*
              Seasons are named by the year they started in, so the 2025 season
              covers the games played from September 2025 into January 2026.
            */}
            <Select.Root
              // The season asked for, not the one loaded, so the trigger shows
              // the switch immediately. Falls back for `make run`, where there
              // is no season list to have asked from.
              value={requestedSeason ?? seasonYear ?? null}
              onValueChange={(season) =>
                season != null && setSelectedSeason(season)
              }
              disabled={isWeekInfoLoading}
            >
              <Select.Trigger
                aria-label="Season"
                className="home__week-input home__season-input select__trigger"
              >
                <Select.Value>
                  {(season: number | null) =>
                    season != null ? seasonLabel(season) : "Select a season..."
                  }
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
                    {selectableSeasons.map((season) => (
                      <Select.Item
                        key={season}
                        value={season}
                        className="select__item"
                      >
                        <Select.ItemText>{seasonLabel(season)}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>

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
              <Select.Trigger
                aria-label="Week"
                className="home__week-input select__trigger"
              >
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
                navigate(`/${seasonYear}/${selectedWeek?.value}/scoreboard`)
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

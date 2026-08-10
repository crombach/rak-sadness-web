import { InfoIcon, LeaderboardIcon, RefreshIcon } from "../icon/Icon";
import getClasses from "../../utils/getClasses";
import Button from "../button/Button";
import "./ScoresNavbar.scss";

export type ScoresView = "Scoreboard" | "Explanation";

/** The scoreboard/explanation switch and the refresh button. */
export default function ScoresNavbar({
  view,
  onViewChange,
  onRefresh,
  isRefreshing,
  disabled = false,
}: {
  view: ScoresView;
  onViewChange: (view: ScoresView) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  /** Set while a week is still loading, so the navbar keeps its shape. */
  disabled?: boolean;
}) {
  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => onViewChange("Scoreboard")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Scoreboard",
        })}`}
      >
        <LeaderboardIcon />
      </Button>
      <Button
        disabled={disabled}
        onClick={() => onViewChange("Explanation")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Explanation",
        })}`}
      >
        <InfoIcon />
      </Button>
      <div className="home__scores-header-divider" />
      <Button
        disabled={disabled}
        onClick={onRefresh}
        className={`home__scores-header-button ${getClasses({
          "--spinning": isRefreshing,
        })}`}
      >
        <RefreshIcon />
      </Button>
    </>
  );
}

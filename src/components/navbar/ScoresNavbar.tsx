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
}: {
  view: ScoresView;
  onViewChange: (view: ScoresView) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <>
      <Button
        onClick={() => onViewChange("Scoreboard")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Scoreboard",
        })}`}
      >
        <LeaderboardIcon />
      </Button>
      <Button
        onClick={() => onViewChange("Explanation")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Explanation",
        })}`}
      >
        <InfoIcon />
      </Button>
      <div className="home__scores-header-divider" />
      <Button
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

import { InfoIcon, LeaderboardIcon, RefreshIcon } from "../icon/Icon";
import getClasses from "../../utils/getClasses";
import Button from "../button/Button";
import "./ScoresNavbar.scss";

export type ScoresView = "Scoreboard" | "Picks";

/** The scoreboard/picks switch and the refresh button. */
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
        {/* Hidden by the stylesheet on a narrow screen, where the icon has to
            carry the button on its own. */}
        <span className="home__scores-header-label">Scoreboard</span>
      </Button>
      <Button
        disabled={disabled}
        onClick={() => onViewChange("Picks")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Picks",
        })}`}
      >
        <InfoIcon />
        <span className="home__scores-header-label">Picks</span>
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

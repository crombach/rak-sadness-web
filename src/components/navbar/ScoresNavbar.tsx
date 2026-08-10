import { Info, Leaderboard, Refresh } from "@mui/icons-material";
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
        <Leaderboard />
      </Button>
      <Button
        onClick={() => onViewChange("Explanation")}
        className={`home__scores-header-button ${getClasses({
          "--active": view === "Explanation",
        })}`}
      >
        <Info />
      </Button>
      <div className="home__scores-header-divider" />
      <Button
        onClick={onRefresh}
        className={`home__scores-header-button ${getClasses({
          "--spinning": isRefreshing,
        })}`}
      >
        <Refresh />
      </Button>
    </>
  );
}

import { CSSProperties, useEffect, useState } from "react";
import {
  EmojiEventsIcon,
  FactCheckIcon,
  LeaderboardIcon,
  RefreshIcon,
} from "../icon/Icon";
import getClasses from "../../utils/getClasses";
import Button from "../button/Button";
import "./ScoresNavbar.scss";

export type ScoresView = "Scoreboard" | "Picks";

/**
 * How long the live-week buttons take to fade and narrow away. Held here because
 * they have to stay mounted for exactly that long. The stylesheet reads it back as
 * `--collapse-duration`, so the two cannot drift apart.
 */
export const COLLAPSE_DURATION_MS = 300;

/** The scoreboard/picks switch, and the buttons a week still being played gets. */
export default function ScoresNavbar({
  view,
  onViewChange,
  onRefresh,
  onShowAnalysis,
  isRefreshing,
  disabled = false,
  isWeekLive,
}: {
  view: ScoresView;
  onViewChange: (view: ScoresView) => void;
  onRefresh: () => void;
  onShowAnalysis: () => void;
  isRefreshing: boolean;
  /** Set while a week is still loading, so the navbar keeps its shape. */
  disabled?: boolean;
  /**
   * Cleared once the week is over, when rescoring cannot change anything and
   * nobody has a path to victory left to work out.
   */
  isWeekLive: boolean;
}) {
  // A week arrives loading, so these are usually on screen by the time it turns
  // out to be decided. Kept mounted for the length of the collapse so they animate
  // out, and a week already known to be decided never renders them at all.
  const [isLiveMounted, setLiveMounted] = useState(isWeekLive);
  if (isWeekLive && !isLiveMounted) setLiveMounted(true);
  useEffect(() => {
    if (isWeekLive || !isLiveMounted) return;
    const timer = setTimeout(() => setLiveMounted(false), COLLAPSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isWeekLive, isLiveMounted]);

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
        <FactCheckIcon />
        <span className="home__scores-header-label">Picks</span>
      </Button>
      {isLiveMounted && (
        <div
          className={`home__scores-header-live ${getClasses({
            "--collapsed": !isWeekLive,
          })}`}
          style={
            {
              "--collapse-duration": `${COLLAPSE_DURATION_MS}ms`,
            } as CSSProperties
          }
          // On its way out it is still painted, so it has to stop being reachable
          // by pointer, keyboard, and screen reader on its own.
          inert={!isWeekLive}
        >
          <div className="home__scores-header-live-content">
            <div className="home__scores-header-divider" />
            <Button
              ariaLabel="Refresh"
              disabled={disabled}
              onClick={onRefresh}
              className={`home__scores-header-button ${getClasses({
                "--spinning": isRefreshing,
              })}`}
            >
              <RefreshIcon />
            </Button>
            <Button
              ariaLabel="Player Analysis"
              color="gold"
              disabled={disabled}
              onClick={onShowAnalysis}
              className="home__scores-header-button home__scores-header-analysis"
            >
              <EmojiEventsIcon />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

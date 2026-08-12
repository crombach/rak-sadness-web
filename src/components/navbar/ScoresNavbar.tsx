import { CSSProperties, useEffect, useState } from "react";
import { FactCheckIcon, LeaderboardIcon, RefreshIcon } from "../icon/Icon";
import Button from "../button/Button";
import "./ScoresNavbar.scss";

export type ScoresView = "Scoreboard" | "Picks";

/**
 * How long the refresh button takes to fade and narrow away. Held here because it
 * has to stay mounted for exactly that long. The stylesheet reads it back as
 * `--collapse-duration`, so the two cannot drift apart.
 */
export const COLLAPSE_DURATION_MS = 300;

/** The scoreboard/picks switch, and the refresh a week still being played gets. */
export default function ScoresNavbar({
  view,
  onViewChange,
  onRefresh,
  isRefreshing,
  disabled = false,
  isWeekLive,
}: {
  view: ScoresView;
  onViewChange: (view: ScoresView) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  /** Set while a week is still loading, so the navbar keeps its shape. */
  disabled?: boolean;
  /** Cleared once the week is over, when rescoring cannot change anything. */
  isWeekLive: boolean;
}) {
  // A week arrives loading, so this is usually on screen by the time it turns out
  // to be decided. Kept mounted for the length of the collapse so it animates out,
  // and a week already known to be decided never renders it at all.
  const [isLiveMounted, setLiveMounted] = useState(isWeekLive);
  if (isWeekLive && !isLiveMounted) setLiveMounted(true);
  useEffect(() => {
    if (isWeekLive || !isLiveMounted) return;
    const timer = setTimeout(() => setLiveMounted(false), COLLAPSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isWeekLive, isLiveMounted]);

  return (
    // The two views are the only way through the results, so they are navigation
    // rather than a pair of loose buttons.
    <nav className="home__scores-nav" aria-label="Results view">
      {/*
        `aria-disabled` rather than `disabled` while a week loads. The buttons sit
        where they will sit, showing the view the URL already names, and keep both
        their place in the tab order and their own look until there is something
        to switch between.
      */}
      <Button
        ariaDisabled={disabled}
        compact
        selected={view === "Scoreboard"}
        onClick={() => onViewChange("Scoreboard")}
        className="home__scores-header-button"
      >
        <LeaderboardIcon />
        {/* Drawn only where the navbar has room, and read by a screen reader
            everywhere, so the button is never nameless. */}
        <span className="home__scores-header-label">Scoreboard</span>
      </Button>
      <Button
        ariaDisabled={disabled}
        compact
        selected={view === "Picks"}
        onClick={() => onViewChange("Picks")}
        className="home__scores-header-button"
      >
        <FactCheckIcon />
        <span className="home__scores-header-label">Picks</span>
      </Button>
      {isLiveMounted && (
        <div
          className={`home__scores-header-live ${isWeekLive ? "" : "--collapsed"}`}
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
              ariaDisabled={disabled}
              busy={isRefreshing}
              compact
              onClick={onRefresh}
              className="home__scores-header-button"
            >
              <RefreshIcon />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

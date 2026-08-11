import { CSSProperties, useEffect, useState } from "react";
import { FactCheckIcon, LeaderboardIcon, RefreshIcon } from "../icon/Icon";
import getClasses from "../../utils/getClasses";
import Button from "../button/Button";
import "./ScoresNavbar.scss";

export type ScoresView = "Scoreboard" | "Picks";

/**
 * How long the refresh button takes to fade and narrow away. Held here because the
 * button has to stay mounted for exactly that long. The stylesheet reads it back as
 * `--collapse-duration`, so the two cannot drift apart.
 */
export const COLLAPSE_DURATION_MS = 300;

/** The scoreboard/picks switch and the refresh button. */
export default function ScoresNavbar({
  view,
  onViewChange,
  onRefresh,
  isRefreshing,
  disabled = false,
  canRefresh = true,
}: {
  view: ScoresView;
  onViewChange: (view: ScoresView) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  /** Set while a week is still loading, so the navbar keeps its shape. */
  disabled?: boolean;
  /** Cleared once the week is over, when rescoring cannot change anything. */
  canRefresh?: boolean;
}) {
  // A week arrives loading, so the button is usually on screen by the time it turns
  // out to be decided. Kept mounted for the length of the collapse so it animates
  // out, and a week already known to be decided never renders it at all.
  const [isRefreshMounted, setRefreshMounted] = useState(canRefresh);
  if (canRefresh && !isRefreshMounted) setRefreshMounted(true);
  useEffect(() => {
    if (canRefresh) return;
    const timer = setTimeout(
      () => setRefreshMounted(false),
      COLLAPSE_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [canRefresh]);

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
      {isRefreshMounted && (
        <div
          className={`home__scores-header-refresh ${getClasses({
            "--collapsed": !canRefresh,
          })}`}
          style={
            {
              "--collapse-duration": `${COLLAPSE_DURATION_MS}ms`,
            } as CSSProperties
          }
          // On its way out it is still painted, so it has to stop being reachable
          // by pointer, keyboard, and screen reader on its own.
          inert={!canRefresh}
        >
          <div className="home__scores-header-refresh-content">
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
          </div>
        </div>
      )}
    </>
  );
}

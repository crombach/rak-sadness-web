import { useEffect, useState } from "react";
import { GameStatus } from "../types/ESPN";
import { WeekInfo } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";
import { WeekGame } from "../types/WeekGame";
import { getGameResult } from "../utils/getLeagueResults";
import latestOnly from "../utils/latestOnly";

/** How often a game still being played is asked about again. */
export const POLL_MS = 20_000;

/**
 * One game, kept up to date for as long as it is being looked at.
 *
 * The week's scores carry the game as it stood when they were worked out, which is
 * stale the moment a live game moves, so a game is fetched again before it is
 * shown and then on `POLL_MS` until it is final. A final game is fetched once and
 * left alone.
 *
 * The game already on screen stays there while the next one is fetched, the way the
 * player analysis holds the last answer up behind its progress bar. `games` is the
 * scoring pass it belongs to: a rescore replaces every game, so it takes the one on
 * screen away with it.
 */
export default function useLiveGame({
  open,
  game,
  games,
  week,
  season,
}: {
  open: boolean;
  game?: WeekGame;
  games?: Array<WeekGame>;
  week?: WeekInfo;
  season?: number;
}): { shown?: LeagueResult; isLoading: boolean; isFetching: boolean } {
  const [found, setFound] = useState<{
    games: Array<WeekGame>;
    label: string;
    result: LeagueResult;
  }>();
  const [fetching, setFetching] = useState(false);

  // The pieces the fetch needs, rather than the game itself, so a rebuilt object
  // cannot restart the poll on every render.
  const label = game?.label;
  const league = game?.league;
  const eventId = game?.result?.id;

  useEffect(() => {
    if (!open || games == null || week == null) return;
    if (label == null || league == null || eventId == null) return;
    let timer = 0;
    const stop = latestOnly(async (isCurrent) => {
      const poll = async () => {
        let result: LeagueResult | null = null;
        setFetching(true);
        try {
          result = await getGameResult(league, week, eventId, season);
        } catch (error) {
          console.warn(`Failed to fetch game ${eventId}`, error);
        }
        if (!isCurrent()) return;
        setFetching(false);
        if (result != null) {
          setFound({ games, label, result });
        }
        // Rescheduled from the end of a fetch rather than on an interval, so a
        // slow answer cannot leave two requests running at once. A game with no
        // answer at all is asked about again, since the next week's list may hold
        // it.
        if (result == null || result.status !== GameStatus.FINAL) {
          timer = window.setTimeout(poll, POLL_MS);
        }
      };
      await poll();
    });
    return () => {
      stop();
      window.clearTimeout(timer);
      // The answer to the fetch this leaves behind is dropped, so nothing is
      // outstanding whatever it comes back with.
      setFetching(false);
    };
  }, [open, games, label, league, eventId, week, season]);

  const shown =
    found != null && found.games === games ? found.result : undefined;
  const isLoading =
    game != null &&
    eventId != null &&
    (shown == null || found?.label !== label);
  // `isLoading` is the wait with nothing to show behind it, and `isFetching` every
  // wait, a poll of a game already on screen included.
  return { shown, isLoading, isFetching: fetching };
}

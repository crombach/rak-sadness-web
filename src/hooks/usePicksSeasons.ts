import { useEffect, useMemo, useState } from "react";

type SeasonsResponse = {
  years: Array<number>;
};

/**
 * The seasons that have picks in the database, newest first.
 *
 * A season is named by the year it started in, so 2025 covers the games played
 * from September 2025 into January 2026.
 *
 * `make run` is a bare dev server with no Pages Function behind it, so it answers
 * this path with the app's own HTML at 200. That reads the same as an empty list
 * here, and the caller falls back to the season running now, which is the only
 * one that can be scored from a local upload anyway.
 */
export default function usePicksSeasons() {
  const [seasons, setSeasons] = useState<Array<number>>();
  const [isSeasonsLoading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const loadSeasons = async () => {
      try {
        const response = await fetch("/api/picks");
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok || !contentType.includes("application/json")) {
          throw new Error(`Seasons response was ${contentType}`);
        }
        const body: SeasonsResponse = await response.json();
        if (isCurrent) {
          setSeasons(body.years);
        }
      } catch (error) {
        console.warn("Could not list the seasons that have picks", error);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };
    loadSeasons();
    return () => {
      isCurrent = false;
    };
  }, []);

  return useMemo(
    () => ({ seasons, isSeasonsLoading }),
    [seasons, isSeasonsLoading],
  );
}

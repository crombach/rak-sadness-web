import { useEffect, useMemo, useState } from "react";
import { League } from "../types/League";
import getLeagueInfo from "../utils/getLeagueInfo";

/**
 * The season running now, by the year it started in.
 *
 * Asked for on its own, because the season list holds only the seasons with picks
 * in the database, and the picker has to offer this one whether or not it has any.
 * A week of it with no picks behind it is scored from a spreadsheet the user
 * uploads, which is what that path is for.
 *
 * Left undefined where ESPN cannot be reached. The picker then falls back to the
 * seasons it does know about, so a failure here costs the current season its place
 * in the list and nothing else.
 */
export default function useCurrentSeason() {
  const [currentSeason, setCurrentSeason] = useState<number>();

  useEffect(() => {
    let isCurrent = true;
    const loadCurrentSeason = async () => {
      try {
        // No season named, so ESPN answers with the one running now.
        const proLeagueInfo = await getLeagueInfo(League.PRO);
        if (isCurrent) {
          setCurrentSeason(proLeagueInfo?.season);
        }
      } catch (error) {
        console.warn("Could not work out the season running now", error);
      }
    };
    loadCurrentSeason();
    return () => {
      isCurrent = false;
    };
  }, []);

  return useMemo(() => ({ currentSeason }), [currentSeason]);
}

import { useEffect, useMemo, useState } from "react";
import { Toast, useToastActions } from "../context/ToastContext";
import { League, WeekInfo } from "../types/League";
import getLeagueInfo from "../utils/getLeagueInfo";

/**
 * The season's weeks, from the ESPN calendar, plus which one is selected.
 *
 * `selectableWeeks` holds the very objects the calendar returned. The week picker
 * compares its options by reference, so copying or rebuilding a `WeekInfo`
 * anywhere downstream leaves the picker unable to show a selection.
 */
export default function useLeagueWeeks() {
  const { showToast } = useToastActions();

  const [weeks, setWeeks] = useState<Array<WeekInfo>>();
  const [currentWeek, setCurrentWeek] = useState<number>();
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const getLeagueInfoAsync = async () => {
      const proLeagueInfo = await getLeagueInfo(League.PRO);
      if (proLeagueInfo == null) {
        setLoading(false);
        showToast(
          new Toast("danger", "Error", "Failed to load the NFL schedule."),
        );
        return;
      }
      // Set to the current regular season week, or the max if it's the post- or off-season.
      setWeeks(proLeagueInfo.activeCalendar.weeks);
      setCurrentWeek(proLeagueInfo.activeWeek.value);
      setSelectedWeek(proLeagueInfo.activeWeek);
      setLoading(false);
    };
    getLeagueInfoAsync();
  }, [showToast]);

  // Newest first, and never a week the season has not reached.
  const selectableWeeks = useMemo(
    () => (weeks ?? []).slice(0, currentWeek).reverse(),
    [weeks, currentWeek],
  );

  return {
    weeks,
    selectableWeeks,
    currentWeek,
    selectedWeek,
    setSelectedWeek,
    isLoading,
  };
}

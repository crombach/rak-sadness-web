import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAppData } from "../context/AppDataContext";
import { Toast, useToastActions } from "../context/ToastContext";
import { WeekInfo } from "../types/League";

type GuardResult =
  { status: "loading"; week?: WeekInfo } | { status: "ready"; week: WeekInfo };

type Redirect = { header: string; message: string } | "silent";

/** Seasons are named by the year they started in, so four digits. */
const SEASON_PATTERN = /^\d{4}$/;

/**
 * Decides whether a `/:season/:week` URL has results to show, and sends the user
 * home when it does not.
 *
 * The waiting rules matter more than the redirect ones. A results URL is opened
 * before the schedule has loaded and before the picks have been looked for, so
 * anything that redirects on missing scores has to be sure the week it is judging
 * is the week that was actually tried. That is what `settledWeek` is for, and
 * `seasonYear` is the same guarantee for the season.
 */
export default function useWeekRouteGuard(
  rawSeason?: string,
  rawWeek?: string,
): GuardResult {
  const navigate = useNavigate();
  const { showToast } = useToastActions();
  const {
    weeks,
    currentWeek,
    seasonYear,
    isWeekInfoLoading,
    findWeek,
    selectedWeek,
    setSelectedWeek,
    scores,
    scoresWeek,
    settledWeek,
  } = useAppData();

  const seasonNumber = Number(rawSeason);
  const isKnownSeason = SEASON_PATTERN.test(rawSeason ?? "");
  const weekNumber = Number(rawWeek);
  const week = Number.isInteger(weekNumber) ? findWeek(weekNumber) : undefined;
  const isSelectableWeek =
    week != null && currentWeek != null && weekNumber <= currentWeek;

  // The URL is the source of truth. Comparing before writing matters: setting
  // the same week again would restart the fetch chain behind it. The season is
  // the provider's to follow, which it does while rendering, so it is already
  // right by the time this runs.
  useEffect(() => {
    if (isSelectableWeek && week !== selectedWeek) {
      setSelectedWeek(week);
    }
  }, [isSelectableWeek, week, selectedWeek, setSelectedWeek]);

  let result: GuardResult;
  let redirect: Redirect | undefined;
  if (!isKnownSeason) {
    result = { status: "loading" };
    redirect = {
      header: "Unknown Season",
      message: `${rawSeason} isn't a season, so there is nothing to show.`,
    };
  } else if (isWeekInfoLoading) {
    result = { status: "loading" };
  } else if (weeks == null) {
    // The schedule lookup failed, and already said so in its own toast.
    result = { status: "loading" };
    redirect = "silent";
  } else if (seasonNumber !== seasonYear) {
    // The schedule on hand is still the season we came from.
    result = { status: "loading" };
  } else if (!isSelectableWeek) {
    result = { status: "loading" };
    redirect = {
      header: "Unknown Week",
      message: `Week ${rawWeek} isn't part of the ${seasonNumber} season, so there is nothing to show.`,
    };
  } else if (settledWeek !== weekNumber) {
    result = { status: "loading", week };
  } else if (scoresWeek !== weekNumber || !scores?.scores.length) {
    result = { status: "loading", week };
    redirect = {
      header: "No Results",
      message: `There are no results for week ${weekNumber} of ${seasonNumber} yet. Upload a picks spreadsheet to see them.`,
    };
  } else {
    result = { status: "ready", week };
  }

  // Latched, because StrictMode runs effects twice and every Toast is distinct,
  // so an unlatched redirect would show the same message twice.
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (redirect == null || hasRedirected.current) return;
    hasRedirected.current = true;
    if (redirect !== "silent") {
      // Deliberately additive. A failure that sent us here already said what
      // went wrong, and clearing toasts would take that message away.
      showToast(new Toast("warning", redirect.header, redirect.message));
    }
    // The week stays selected, so home opens on the week that was asked for.
    navigate("/", { replace: true });
  }, [redirect, navigate, showToast]);

  return result;
}

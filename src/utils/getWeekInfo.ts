import { League, SeasonType, WeekInfo } from "../types/League";

type WeekEntry = {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
};

type Calendar = {
  value: number;
  startDate: string;
  endDate: string;
  entries: WeekEntry[];
};

type LeagueMetadata = {
  slug: string;
  calendar: Calendar[];
};

type Scoreboard = {
  leagues: LeagueMetadata[];
};

/**
 * Fetches the regular season calendar from the NFL scoreboard endpoint and returns information about the current week,
 * as well as the league's calendar in general.
 * NFL weeks usually run from Wednesday to Wednesday. For example: 2023-09-13T07:00Z to 2023-09-20T06:59Z
 *
 * @returns Promise that resolves to the current week number (if found) or null (if not found)
 */
export default async function getWeekInfo(
  league: League,
): Promise<WeekInfo | null> {
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard`,
  );
  if (!response.ok) {
    console.error(
      `Error fetching data from scoreboard endpoint for league ${league}`,
      response.status,
    );
    return null;
  }
  const scoreboard: Scoreboard = await response.json();

  // Get the current time in epoch millis.
  const currentDate = new Date();

  // Find the league. Should always be index 0, but we are being safe.
  const leagueInfo = scoreboard.leagues.find(
    (l) => l.slug === (league as string),
  );

  // If no week was provided, find the active calendar for the current date/time.
  const activeCalendar = leagueInfo.calendar.find((c) => {
    const startDate = new Date(c.startDate);
    const endDate = new Date(c.endDate);
    return startDate <= currentDate && endDate >= currentDate;
  });

  // Find the calendar entry for the current week
  for (const weekEntry of activeCalendar.entries) {
    const startDate = new Date(weekEntry.startDate);
    const endDate = new Date(weekEntry.endDate);
    if (startDate <= currentDate && endDate >= currentDate) {
      return {
        league,
        seasonType: activeCalendar.value as SeasonType,
        value: parseInt(weekEntry.value),
        startDate,
        endDate,
      };
    }
  }

  // No entry found for the current week
  console.warn(
    `Current date is not within the bounds of a week for league ${league}`,
  );
  return null;
}

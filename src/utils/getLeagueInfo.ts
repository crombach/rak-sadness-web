import { League, LeagueInfo, SeasonType } from "../types/League";

type WeekEntry = {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
};

type Calendar = {
  value: string;
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
 * Fetches league information from the ESPN API.
 */
export default async function getLeagueInfo(
  league: League,
): Promise<LeagueInfo | null> {
  // Get the ESPN league data.
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard`,
  );
  if (!response.ok) {
    console.error(
      `Error fetching league info from scoreboard endpoint for league ${league}`,
      response.status,
    );
    return null;
  }
  const scoreboard: Scoreboard = await response.json();

  // Find the requested league. Should always be index 0, but we are being safe.
  const leagueMetadata = scoreboard.leagues.find(
    (it) => it.slug === (league as string),
  );

  // Get the current datetime.
  const now = new Date();

  // Map calendar objects to the format we need.
  const calendars = leagueMetadata.calendar.map((cal) => {
    return {
      seasonType: parseInt(cal.value) as SeasonType,
      startDate: new Date(cal.startDate),
      endDate: new Date(cal.endDate),
      weeks: cal.entries.map((week) => {
        return {
          value: parseInt(week.value),
          label: week.label,
          startDate: new Date(week.startDate),
          endDate: new Date(week.endDate),
        };
      }),
    };
  });

  // Find the active calendar for the current league and date/time.
  // For the NFL, we always want to use the regular season calendar.
  // For the NCAA, we go by date.
  const activeCalendar =
    league === League.PRO
      ? calendars.find((cal) => cal.seasonType === SeasonType.REGULAR)
      : calendars.find((cal) => {
          return cal.startDate <= now && cal.endDate >= now;
        });

  // Find the active week for the current date/time if applicable.
  const activeWeek = activeCalendar?.weeks.find((week) => {
    return week.startDate <= now && week.endDate >= now;
  });

  return {
    league,
    activeCalendar,
    activeWeek,
    calendars,
  };
}

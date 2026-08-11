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
  /** Absent on calendars that have no weeks, which is how ESPN sends Off Season. */
  entries?: WeekEntry[];
};

type LeagueMetadata = {
  slug: string;
  /** The year the season started in, whatever calendar year its games fall in. */
  season: { year: number };
  calendar: Calendar[];
};

type Scoreboard = {
  leagues: LeagueMetadata[];
};

/**
 * Fetches league information from the ESPN API.
 *
 * `season` is the year a season started in, which is what ESPN's `dates` means
 * here: `dates=2025` covers the games played from September 2025 into January
 * 2026, not the 2026 games of the season after. Left out, ESPN answers with
 * whichever season is running now.
 */
export default async function getLeagueInfo(
  league: League,
  season?: number,
): Promise<LeagueInfo | null> {
  // Get the ESPN league data.
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard${
      season != null ? `?dates=${season}` : ""
    }`,
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
  if (leagueMetadata == null) {
    console.error(`Scoreboard response has no calendar for league ${league}`);
    return null;
  }

  // Get the current datetime.
  const now = new Date();

  // Map calendar objects to the format we need.
  const calendars = leagueMetadata.calendar.map((cal) => {
    return {
      seasonType: parseInt(cal.value) as SeasonType,
      startDate: new Date(cal.startDate),
      endDate: new Date(cal.endDate),
      weeks: (cal.entries ?? []).map((week) => {
        return {
          value: parseInt(week.value),
          label: week.label,
          startDate: new Date(week.startDate),
          endDate: new Date(week.endDate),
        };
      }),
    };
  });

  // A calendar with no weeks can never yield an active week, and ESPN ships one
  // every year: Off Season. Leave it out of the running.
  const datedCalendars = calendars.filter((cal) => cal.weeks.length > 0);

  // Find the active calendar for the current league and date/time.
  // For the NFL, we always want to use the regular season calendar.
  // For the NCAA, we go by date because we cross into the postseason.
  // Fall back to the last calendar.
  const activeCalendar =
    league === League.PRO
      ? datedCalendars.find((cal) => cal.seasonType === SeasonType.REGULAR)
      : datedCalendars.find((cal, index) => {
          return (
            (cal.startDate <= now && cal.endDate >= now) ||
            index === datedCalendars.length - 1
          );
        });

  // Find the active week for the current date/time, if applicable.
  // Fall back to the last week in the active calendar.
  const activeWeek = activeCalendar?.weeks.find((week, index) => {
    return (
      (week.startDate <= now && week.endDate >= now) ||
      index === activeCalendar.weeks.length - 1
    );
  });

  // Both lookups fall back to the last entry, so they only come back empty when
  // the response carried no calendars or no weeks at all.
  if (activeCalendar == null || activeWeek == null) {
    console.error(
      `Scoreboard response has no active week for league ${league}`,
    );
    return null;
  }

  return {
    league,
    season: leagueMetadata.season.year,
    activeCalendar,
    activeWeek,
    calendars,
  };
}

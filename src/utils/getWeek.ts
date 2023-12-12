type WeekEntry = {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
}

type Calendar = {
  label: string;
  entries: WeekEntry[];
}

type League = {
  abbreviation: string;
  calendar: Calendar[];
}

type Scoreboard = {
  leagues: League[];
}

/**
 * Fetches the regular season calendar from the NFL scoreboard endpoint and returns the week number based on the current date.
 * NFL weeks usually run from Wednesday to Wednesday. For example: 2023-09-13T07:00Z to 2023-09-20T06:59Z
 *
 * @returns Promise that resolves to the current week number (if found) or null (if not found)
 */
export default async function getWeek(): Promise<number | null> {
  // Rak uses NFL weeks, so we can hardcode NFL here
  const response = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
  );
  if (!response.ok) {
    console.error(
      `Error fetching data from scoreboard endpoint: ${response.status}`
    );
    return null;
  }
  const scoreboard: Scoreboard = await response.json();

  // Find the league. Should always be index 0
  const league = scoreboard.leagues.find((l) => l.abbreviation === "NFL");

  // Find the calendar for regular season. Seems like this should always be index 1, but iterate through to be sure.
  const calendar = league.calendar.find((c) => c.label === "Regular Season");

  // Extract the week objects from the regular season calendar
  const entries: WeekEntry[] = calendar.entries;

  // Get the current date
  const currentDate = new Date();

  // Find the entry for the current week
  for (const entry of entries) {
    const startDate = new Date(entry.startDate);
    const endDate = new Date(entry.endDate);

    if (currentDate >= startDate && currentDate <= endDate) {
      return parseInt(entry.value);
    }
  }

  // No entry found for the current week
  console.warn("Current date is not within the bounds of an NFL week");
  return null;
}

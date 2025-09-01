import { EspnCompetitor, EspnEvent, GameStatus, HomeAway } from "../types/ESPN";
import { League, SeasonType, WeekInfo } from "../types/League";
import { LeagueResult, Possession } from "../types/LeagueResult";

/**
 * NCAA regular season has 16 weeks in 2024 (Army/Navy is its own week for some reason).
 * In the past, this number was 15. Check back in 2025.
 * TODO: Use the LeagueInfo construct to work around hard-coding this value.
 */
const WEEKS_COLLEGE_REGULAR_SEASON = 16;

/**
 * NFL regular season has 18 weeks.
 */
const WEEKS_PRO_REGULAR_SEASON = 18;

/**
 * Week 1 of Rak Madness is week 1 in the NFL, but week 2 in the NCAA.
 * We account for this by adding 1 to the week if NCAA results have been requested.
 */
const WEEK_OFFSET_COLLEGE = 1;

// You can find group IDs by looking at weekly scoreboards. Example:
// https://www.espn.com/college-football/scoreboard/_/group/22
const COLLEGE_GROUPS = [
  80, // Division 1
  22, // Ivy League (occasionally appears in Rak Madness)
];

async function getLeagueEvents(
  league: League,
  week: WeekInfo, // Rak Madness week, corresponds with NFL regular season week
): Promise<Array<EspnEvent>> {
  // After the regular season is over, ESPN resets the week counter to 1 for the postseason.
  let adjustedWeekNumber =
    league === League.COLLEGE
      ? week.value + WEEK_OFFSET_COLLEGE
      : week.value > WEEKS_PRO_REGULAR_SEASON
        ? week.value % WEEKS_PRO_REGULAR_SEASON
        : week.value;
  const seasonType: SeasonType =
    (league === League.COLLEGE &&
      adjustedWeekNumber <= WEEKS_COLLEGE_REGULAR_SEASON) ||
    (league === League.PRO && week.value <= WEEKS_PRO_REGULAR_SEASON)
      ? SeasonType.REGULAR
      : SeasonType.POST;
  // For college games, the postseason is all week 1
  // because EPSN considers the entire postseason to be "the bowl week".
  if (league === League.COLLEGE && seasonType === SeasonType.POST) {
    adjustedWeekNumber = 1;
  }

  // Build final request URL.
  const baseRequestUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard?week=${adjustedWeekNumber}&seasontype=${seasonType}`;

  // For college, we need to concatenate multiple groups.
  if (league === League.COLLEGE) {
    const collegePromises = COLLEGE_GROUPS.map((groupId: number) => {
      const requestUrl = `${baseRequestUrl}&limit=400&groups=${groupId}`;
      return fetch(requestUrl)
        .then((response) =>
          response.json().then((json) => json.events as Array<EspnEvent>),
        )
        .then((events) => {
          // ESPN jams the entire college postseason into one week.
          // So, we need to remove events that happen before the given NFL week.
          // We'd also like to remove events that happen after, but Rak has (once)
          // put a game in the picks sheet outside the NFL week. Nice.
          return events.filter((event) => {
            const eventDate = new Date(event.date);
            return (
              eventDate.valueOf() >= week.startDate.valueOf()
              // && eventDate.valueOf() <= week.endDate.valueOf()
            );
          });
        });
    });

    // Sort by competition date so later games come first in the array.
    return (await Promise.all(collegePromises)).flat(1).sort((a, b) => {
      return new Date(b.date).valueOf() - new Date(a.date).valueOf();
    });
  }

  // For pro, we can just return the raw events list fetched from the API.
  const response = await fetch(baseRequestUrl);
  const json = await response.json();
  return json.events as Array<EspnEvent>;
}

/**
 * Get the results for a given league in a given week.
 * Output is sorted by date (earliest date first).
 *
 * @param league league for which to get results
 * @param week week in the season (week 1 is the first NFL week)
 * @returns league results
 */
export async function getLeagueResults(
  league: League,
  week: WeekInfo,
  matchups: Array<Set<string>>,
): Promise<Array<LeagueResult>> {
  const events = await getLeagueEvents(league, week);
  console.log(`${league} events`, events);

  return events
    .map((event: EspnEvent) => {
      const status: GameStatus = event.status.type.id;
      const competition = event.competitions[0];
      const home = competition.competitors.find(
        (competitor: EspnCompetitor) => {
          return competitor.homeAway === "home";
        },
      );
      const away = competition.competitors.find(
        (competitor: EspnCompetitor) => {
          return competitor.homeAway === "away";
        },
      );

      // If the event isn't in the matchups for the week, skip it.
      const isInMatchups = matchups.some((teams) => {
        if (teams.size == 2) {
          return (
            teams.has(home.team.abbreviation) &&
            teams.has(away.team.abbreviation)
          );
        } else if (teams.size == 1) {
          return (
            teams.has(home.team.abbreviation) ||
            teams.has(away.team.abbreviation)
          );
        }
        return false;
      });
      if (!isInMatchups) {
        return null;
      }

      const homeScore = Number(home.score);
      const awayScore = Number(away.score);

      let winner: EspnCompetitor | null = null;
      let loser: EspnCompetitor | null = null;
      let winnerHomeAway: HomeAway | null = null;
      let loserHomeAway: HomeAway | null = null;
      if (status === GameStatus.FINAL) {
        if (homeScore > awayScore) {
          winner = home;
          loser = away;
          winnerHomeAway = HomeAway.HOME;
          loserHomeAway = HomeAway.AWAY;
        } else if (awayScore > homeScore) {
          winner = away;
          loser = home;
          winnerHomeAway = HomeAway.AWAY;
          loserHomeAway = HomeAway.HOME;
        }
      }

      const winnerScore = winner === home ? homeScore : awayScore;
      const loserScore = winner === home ? awayScore : homeScore;

      // Calculate possession object
      const possession: Possession = {
        downDistanceText: competition.situation?.downDistanceText,
      };
      if (competition.situation?.possession === home.id) {
        possession.homeAway = HomeAway.HOME;
      } else if (competition.situation?.possession === away.id) {
        possession.homeAway = HomeAway.AWAY;
      }

      return {
        name: event.name,
        shortName: event.shortName,
        date: new Date(event.date),
        status,
        detailMessage: event.status.type.shortDetail,
        home: {
          team: {
            name: home.team.displayName,
            abbreviation: home.team.abbreviation?.toUpperCase(),
          },
          score: homeScore,
        },
        away: {
          team: {
            name: away.team.displayName,
            abbreviation: away.team.abbreviation?.toUpperCase(),
          },
          score: awayScore,
        },
        possession,
        winner: {
          team: winner && {
            name: winner.team.displayName,
            abbreviation: winner.team.abbreviation?.toUpperCase(),
          },
          homeAway: winnerHomeAway,
          by: winnerScore - loserScore,
        },
        loser: {
          team: loser && {
            name: loser.team.displayName,
            abbreviation: loser.team.abbreviation?.toUpperCase(),
          },
          homeAway: loserHomeAway,
          by: winnerScore - loserScore,
        },
        totalScore: winnerScore + loserScore,
      };
    })
    .filter((it) => it != null);
}

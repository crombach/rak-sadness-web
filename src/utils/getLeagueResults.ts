import { LeagueResult } from "../types/LeagueResult";
import { GameStatus, HomeAway, EspnCompetitor, EspnEvent } from "../types/ESPN";
import { League, SeasonType } from "../types/League";

// You can find group IDs by looking at weekly scoreboards. Example:
// https://www.espn.com/college-football/scoreboard/_/group/22
const COLLEGE_GROUPS = [
  80, // Division 1
  22, // Ivy League (occasionally appears in Rak Madness)
];

// NCAA regular season has 15 weeks.
const COLLEGE_REGULAR_SEASON_WEEKS = 15;
// NFL regular season has 18 weeks.
const PRO_REGULAR_SEASON_WEEKS = 18;

async function getLeagueEvents(
  league: League,
  weekNumber: number, // Rak Madness week, corresponds with NFL regular season week
): Promise<Array<EspnEvent>> {
  // Week 1 of Rak Madness is week 1 in the NFL, but week 2 in the NCAA.
  // We account for this by adding 1 to the week if NCAA results have been requested.
  // After the regular season is over, ESPN resets the week counter to 1 for the postseason.
  let adjustedWeek =
    league === League.COLLEGE
      ? weekNumber + 1
      : weekNumber > PRO_REGULAR_SEASON_WEEKS
        ? weekNumber % PRO_REGULAR_SEASON_WEEKS
        : weekNumber;
  const seasonType: SeasonType =
    (league === League.COLLEGE &&
      adjustedWeek <= COLLEGE_REGULAR_SEASON_WEEKS) ||
    (league === League.PRO && weekNumber <= PRO_REGULAR_SEASON_WEEKS)
      ? SeasonType.REGULAR
      : SeasonType.POST;
  // For college games, the postseason is all week 1
  // because EPSN considers the entire postseason to be "the bowl week".
  if (league === League.COLLEGE && seasonType === SeasonType.POST) {
    adjustedWeek = 1;
  }

  // Build final request URL.
  const baseRequestUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard?week=${adjustedWeek}&seasontype=${seasonType}`;

  // For college, we need to concatenate multiple groups.
  if (league === League.COLLEGE) {
    const collegePromises = COLLEGE_GROUPS.map((groupId: number) => {
      const requestUrl = `${baseRequestUrl}&limit=400&groups=${groupId}`;
      return fetch(requestUrl).then((response) =>
        response.json().then((json) => json.events as Array<EspnEvent>),
      );
    });
    // ESPN jams the entire college postseason into one week.
    // Sort by competition date so most recent games come first.
    return (await Promise.all(collegePromises)).flat(1).sort((a, b) => {
      return (
        new Date(b.competitions[0].date).getTime() -
        new Date(a.competitions[0].date).getTime()
      );
    });
  }

  // For pro, we can just return the raw events list fetched from the API.
  const response = await fetch(baseRequestUrl);
  const json = await response.json();
  return json.events as Array<EspnEvent>;
}

/**
 * Get the results for a given league in a given week.
 *
 * @param league league for which to get results
 * @param week week in the season (week 1 is the first NFL week)
 * @returns league results
 */
export async function getLeagueResults(
  league: League,
  week: number,
): Promise<Array<LeagueResult>> {
  const events = await getLeagueEvents(league, week);
  console.debug("=EVENTS=", events);
  return events.map((event: EspnEvent) => {
    const status: GameStatus = event.status.type.id;
    const home = event.competitions[0].competitors.find(
      (competitor: EspnCompetitor) => {
        return competitor.homeAway === "home";
      },
    );
    const away = event.competitions[0].competitors.find(
      (competitor: EspnCompetitor) => {
        return competitor.homeAway === "away";
      },
    );

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

    return {
      name: event.name,
      shortName: event.shortName,
      status,
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
  });
}

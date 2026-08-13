import {
  EspnCompetitor,
  EspnEvent,
  EspnVenue,
  GameStatus,
  HomeAway,
} from "../types/ESPN";
import { League, SeasonType, WeekInfo } from "../types/League";
import {
  GameSide,
  GameVenue,
  LeagueResult,
  Possession,
} from "../types/LeagueResult";
import debugLog from "./debugLog";
import {
  CachedGame,
  isSettled,
  matchupKey,
  readCachedResults,
  writeCachedResults,
} from "./espnCache";
import { getRegularSeasonWeekCount } from "./getLeagueInfo";

/**
 * Used only where the season's own calendar could not be read. The NCAA count
 * moves (15 weeks in 2023, 16 in 2024, Army/Navy being its own week), so it is
 * asked for per season rather than trusted from here.
 */
const WEEKS_COLLEGE_REGULAR_SEASON = 16;
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
  season?: number,
  // Left off where one game is being looked up by id. Rak has put a game in the
  // picks sheet outside the NFL week, and dropping it here would leave that game
  // impossible to fetch again.
  { datedFromWeekStart = true }: { datedFromWeekStart?: boolean } = {},
): Promise<Array<EspnEvent>> {
  const [collegeWeeks, proWeeks] = await Promise.all([
    getRegularSeasonWeekCount(League.COLLEGE, season),
    getRegularSeasonWeekCount(League.PRO, season),
  ]);
  const weeksInCollegeRegularSeason =
    collegeWeeks ?? WEEKS_COLLEGE_REGULAR_SEASON;
  const weeksInProRegularSeason = proWeeks ?? WEEKS_PRO_REGULAR_SEASON;

  // After the regular season is over, ESPN resets the week counter to 1 for the postseason.
  let adjustedWeekNumber =
    league === League.COLLEGE
      ? week.value + WEEK_OFFSET_COLLEGE
      : week.value > weeksInProRegularSeason
        ? week.value % weeksInProRegularSeason
        : week.value;
  const seasonType: SeasonType =
    (league === League.COLLEGE &&
      adjustedWeekNumber <= weeksInCollegeRegularSeason) ||
    (league === League.PRO && week.value <= weeksInProRegularSeason)
      ? SeasonType.REGULAR
      : SeasonType.POST;
  // For college games, the postseason is all week 1
  // because EPSN considers the entire postseason to be "the bowl week".
  if (league === League.COLLEGE && seasonType === SeasonType.POST) {
    adjustedWeekNumber = 1;
  }

  // Build final request URL. `dates` is the year the season started in, not the
  // calendar year its games fall in, so `dates=2025&week=18` is the January 2026
  // game it should be. Left off, ESPN answers with the season running now.
  const seasonParam = season != null ? `&dates=${season}` : "";
  const baseRequestUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard?week=${adjustedWeekNumber}&seasontype=${seasonType}${seasonParam}`;

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
          if (!datedFromWeekStart) return events;
          return events.filter((event) => {
            const eventDate = new Date(event.date);
            return (
              eventDate.valueOf() >= week.startDate.valueOf()
              // && eventDate.valueOf() <= week.endDate.valueOf()
            );
          });
        });
    });

    // Latest first. The postseason arrives as one bowl week spanning a month, so a
    // team can appear twice, and the later game is the one that week is about.
    return (await Promise.all(collegePromises)).flat(1).sort((a, b) => {
      return new Date(b.date).valueOf() - new Date(a.date).valueOf();
    });
  }

  // For pro, we can just return the raw events list fetched from the API.
  const response = await fetch(baseRequestUrl);
  const json = await response.json();
  return json.events as Array<EspnEvent>;
}

/** The season record, which ESPN sends beside the home and road splits. */
const RECORD_TYPE_SEASON = "total";

function gameSide(competitor: EspnCompetitor): GameSide {
  return {
    team: {
      name: competitor.team.displayName,
      // The two halves of that name, which the game status sets on their own lines.
      // Kept only where ESPN sent both: half a name on a line of its own reads as
      // the other half having gone missing.
      location: competitor.team.location,
      mascot: competitor.team.name,
      abbreviation: competitor.team.abbreviation?.toUpperCase(),
      logoUrl: competitor.team.logo,
    },
    score: Number(competitor.score),
    record: competitor.records?.find(
      (record) => record.type === RECORD_TYPE_SEASON,
    )?.summary,
    // A period ESPN sent without a value reads as no points rather than dropping
    // the period, which would slide every later quarter a column left.
    linescores: competitor.linescores?.map((line) => line.value ?? 0) ?? [],
  };
}

function gameVenue(venue?: EspnVenue): GameVenue | undefined {
  return venue?.fullName != null
    ? {
        name: venue.fullName,
        city: venue.address?.city,
        state: venue.address?.state,
      }
    : undefined;
}

/**
 * Whether a game is the one a picks column describes.
 *
 * A column names two teams once anyone has picked either side of it, and one where
 * every player picked the same team.
 */
export function matchesMatchup(
  result: LeagueResult,
  teams: Set<string>,
): boolean {
  // Folded on both sides, because a result carries the abbreviations already
  // uppercased while a workbook could name them any way at all.
  const named = new Set([...teams].map((team) => team?.toUpperCase()));
  const home = result.home.team.abbreviation;
  const away = result.away.team.abbreviation;
  if (named.size === 2) {
    return named.has(home) && named.has(away);
  } else if (named.size === 1) {
    return named.has(home) || named.has(away);
  }
  return false;
}

/**
 * One ESPN event as the app describes a game.
 *
 * Null where ESPN sent an event with a side missing, which it never has. Skipping
 * it beats trusting half a game.
 */
export function toLeagueResult(event: EspnEvent): LeagueResult | null {
  const status: GameStatus = event.status.type.id;
  const competition = event.competitions[0];
  const home = competition.competitors.find(
    (competitor: EspnCompetitor) => competitor.homeAway === "home",
  );
  const away = competition.competitors.find(
    (competitor: EspnCompetitor) => competitor.homeAway === "away",
  );
  if (home == null || away == null) {
    return null;
  }

  const homeSide = gameSide(home);
  const awaySide = gameSide(away);
  const { score: homeScore } = homeSide;
  const { score: awayScore } = awaySide;

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
  // Unsigned, so a live game the home team leads never reads as a negative
  // margin just because there is no winner yet.
  const scoreMargin = Math.abs(homeScore - awayScore);

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
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    date: new Date(event.date),
    status,
    detailMessage: event.status.type.shortDetail,
    period: event.status.period,
    clock: event.status.displayClock,
    home: homeSide,
    away: awaySide,
    isNeutralSite: competition.neutralSite ?? false,
    venue: gameVenue(competition.venue),
    possession,
    winner: {
      team: winner && {
        name: winner.team.displayName,
        abbreviation: winner.team.abbreviation?.toUpperCase(),
      },
      homeAway: winnerHomeAway,
      by: scoreMargin,
    },
    loser: {
      team: loser && {
        name: loser.team.displayName,
        abbreviation: loser.team.abbreviation?.toUpperCase(),
      },
      homeAway: loserHomeAway,
      by: scoreMargin,
    },
    totalScore: winnerScore + loserScore,
  };
}

/**
 * The order the fetch puts a league's games in.
 *
 * College is latest first, because its postseason arrives as one bowl week spanning a
 * month and a team can appear twice, the later game being the one the week is about.
 * Whichever game of the two comes first is the one every lookup by team answers with.
 */
function inFetchOrder(
  league: League,
  results: Array<LeagueResult>,
): Array<LeagueResult> {
  if (league !== League.COLLEGE) {
    return results;
  }
  return [...results].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/**
 * Get the results for a given league in a given week, in `inFetchOrder`.
 *
 * Nothing is fetched where this browser already has an answer for every matchup that
 * ESPN cannot answer differently later: a game that has been played, or a matchup it
 * listed no game for. That covers a whole week once its last game is over, which is
 * every week but the one being played, and the calendar reads behind the fetch go with
 * it. Changing the picks changes which matchups are asked about, and a matchup that
 * moved has nothing stored under its new name, so the week is fetched again.
 *
 * @param league league for which to get results
 * @param week week in the season (week 1 is the first NFL week)
 * @param matchups the games the picks describe
 * @param season the year the season started in, current season if left out
 * @returns league results
 */
export async function getLeagueResults(
  league: League,
  week: WeekInfo,
  matchups: Array<Set<string>>,
  season?: number,
): Promise<Array<LeagueResult>> {
  const keys = matchups.map(matchupKey);
  // "Whichever season is running" is not something an answer can be filed under, so a
  // week with no season named is always fetched.
  const held =
    season != null ? readCachedResults(season, week.value, league) : {};
  if (keys.every((key) => key in held)) {
    const settled = [...new Set(keys)]
      .map((key) => held[key])
      .filter((game) => game != null);
    debugLog(`${league} games, every one of them already held`, settled);
    return inFetchOrder(league, settled);
  }

  const events = await getLeagueEvents(league, week, season);
  debugLog(`${league} events`, events);

  const results = events
    .map(toLeagueResult)
    .filter((it) => it != null)
    .filter((result) =>
      matchups.some((teams) => matchesMatchup(result, teams)),
    );

  // Each matchup and the one game the fetch found for it. `find` over results already
  // in fetch order picks the same game every lookup by team will.
  const found = new Map<string, CachedGame>();
  matchups.forEach((teams, index) => {
    if (found.has(keys[index])) return;
    found.set(
      keys[index],
      results.find((result) => matchesMatchup(result, teams)) ?? null,
    );
  });

  const games: Record<string, CachedGame> = {};
  const kept: Array<LeagueResult> = [];
  found.forEach((result, key) => {
    // A game the fetch no longer lists keeps the outcome this browser already had.
    // ESPN moves a game out of a week's answer now and then, and without this the
    // column would go from scored to missing.
    const game = result ?? held[key] ?? null;
    if (result == null && game != null) {
      kept.push(game);
    }
    if (isSettled(game)) {
      games[key] = game;
    }
  });
  // An answer with no games in it is ESPN not having published the week yet, and
  // holding every matchup of it as a hole would leave the week empty for good.
  if (season != null && events.length > 0) {
    writeCachedResults(season, week.value, league, games);
  }

  return inFetchOrder(league, [...results, ...kept]);
}

/**
 * One game, fetched again.
 *
 * The same league fetch the scoring pass makes, picked over by event id rather
 * than by matchup, so watching a live game needs no second endpoint and no second
 * way of reading one. Null where the week no longer holds that game, which a
 * season or week switch can do while a dialog is open on it.
 */
export async function getGameResult(
  league: League,
  week: WeekInfo,
  eventId: string,
  season?: number,
): Promise<LeagueResult | null> {
  const events = await getLeagueEvents(league, week, season, {
    datedFromWeekStart: false,
  });
  const event = events.find((it: EspnEvent) => it.id === eventId);
  return event != null ? toLeagueResult(event) : null;
}

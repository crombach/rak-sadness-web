import { GameStatus, HomeAway } from "../types/ESPN";
import { LeagueResult } from "../types/LeagueResult";

const NO_POSSESSION = {};
const GAME_DATE = new Date("2024-10-06T17:00:00Z");

function team(abbreviation: string) {
  return { name: abbreviation, abbreviation };
}

/**
 * A completed game. `by` is the winner's margin, which is what the spread is
 * compared against, so it is derived from the scores rather than passed in.
 */
export function finalGame({
  home,
  away,
  homeScore,
  awayScore,
}: {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}): LeagueResult {
  const homeTeam = team(home);
  const awayTeam = team(away);
  const isTie = homeScore === awayScore;
  const homeWon = homeScore > awayScore;
  return {
    name: `${away} at ${home}`,
    shortName: `${away} @ ${home}`,
    date: GAME_DATE,
    status: GameStatus.FINAL,
    detailMessage: "Final",
    home: { team: homeTeam, score: homeScore },
    away: { team: awayTeam, score: awayScore },
    possession: NO_POSSESSION,
    winner: {
      team: isTie ? null : homeWon ? homeTeam : awayTeam,
      homeAway: isTie ? null : homeWon ? HomeAway.HOME : HomeAway.AWAY,
      by: Math.abs(homeScore - awayScore),
    },
    loser: {
      team: isTie ? null : homeWon ? awayTeam : homeTeam,
      homeAway: isTie ? null : homeWon ? HomeAway.AWAY : HomeAway.HOME,
      by: Math.abs(homeScore - awayScore),
    },
    totalScore: homeScore + awayScore,
  };
}

/** A game that has not kicked off. Scoring treats it as incomplete. */
export function upcomingGame({
  home,
  away,
}: {
  home: string;
  away: string;
}): LeagueResult {
  return {
    name: `${away} at ${home}`,
    shortName: `${away} @ ${home}`,
    date: GAME_DATE,
    status: GameStatus.UPCOMING,
    detailMessage: "Sun, October 6th",
    home: { team: team(home), score: 0 },
    away: { team: team(away), score: 0 },
    possession: NO_POSSESSION,
    winner: { team: null, homeAway: null, by: 0 },
    loser: { team: null, homeAway: null, by: 0 },
    totalScore: 0,
  };
}

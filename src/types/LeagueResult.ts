import { GameStatus, HomeAway } from "./ESPN";

type Team = {
  name: string;
  abbreviation: string;
  /** Absent for a team ESPN has no mark for, which the college groups have. */
  logoUrl?: string;
};

export type Possession = {
  homeAway?: HomeAway;
  downDistanceText?: string;
};

export type GameVenue = {
  name: string;
  city?: string;
  state?: string;
};

export type GameSide = {
  team: Team;
  score: number;
  /** The season record, like `3-2`. Absent where ESPN did not send one. */
  record?: string;
  /** Points per period, in order. Empty before kickoff. */
  linescores: Array<number>;
};

export type LeagueResult = {
  /** The ESPN event id, which is what a single game is fetched again by. */
  id: string;
  name: string;
  shortName: string;
  date: Date;
  status: GameStatus;
  detailMessage: string;
  /** The quarter the game is in, counting past four into overtime. */
  period?: number;
  /** The clock as ESPN writes it, like `8:42`. */
  clock?: string;
  home: GameSide;
  away: GameSide;
  venue?: GameVenue;
  possession: Possession;
  winner: {
    team: Team | null;
    homeAway: HomeAway | null;
    by: number;
  };
  loser: {
    team: Team | null;
    homeAway: HomeAway | null;
    by: number;
  };
  totalScore: number;
};

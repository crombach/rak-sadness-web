import { GameStatus, HomeAway } from "./ESPN";

type Team = {
  name: string;
  /** Where the team plays, and what they are called there: `Buffalo`, `Bills`. */
  location?: string;
  mascot?: string;
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
  /**
   * Whether the game is played at neither side's own ground, which every bowl game is.
   *
   * ESPN still names a home side for one of them, and the pool still scores the line
   * against it, so the two sides are only ever said to be home and away where they are.
   */
  isNeutralSite: boolean;
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

import { GameStatus, HomeAway } from "./ESPN";

type Team = {
  name: string;
  abbreviation: string;
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
  home: GameSide;
  away: GameSide;
  venue?: GameVenue;
  /** ESPN's page for the game, for the play by play the app does not fetch. */
  gamecastUrl?: string;
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

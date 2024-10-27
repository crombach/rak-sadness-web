import { GameStatus, HomeAway } from "./ESPN";

type Team = {
  name: string;
  abbreviation: string;
};

export type Possession = {
  homeAway?: HomeAway;
  downDistanceText?: string;
};

export type LeagueResult = {
  name: string;
  shortName: string;
  date: Date;
  status: GameStatus;
  detailMessage: string;
  home: {
    team: Team;
    score: number;
  };
  away: {
    team: Team;
    score: number;
  };
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

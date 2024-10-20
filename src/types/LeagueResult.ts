import { GameStatus, HomeAway } from "./ESPN";

type Team = {
  name: string;
  abbreviation: string;
};

export type LeagueResult = {
  name: string;
  shortName: string;
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

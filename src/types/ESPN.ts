export enum HomeAway {
  HOME = "home",
  AWAY = "away",
}

export enum GameStatus {
  UPCOMING = "1",
  LIVE = "2",
  FINAL = "3",
}

export type EspnEvent = {
  name: string;
  shortName: string;
  date: string;
  competitions: Array<EspnCompetition>;
  status: EspnStatus;
};

export type EspnStatus = {
  type: {
    id: GameStatus;
    detail: string;
    shortDetail: string;
  };
};

export type EspnCompetition = {
  competitors: Array<EspnCompetitor>;
  date: string;
};

export type EspnCompetitor = {
  homeAway: HomeAway;
  winner: boolean;
  team: EspnTeam;
  score: string;
};

export type EspnTeam = {
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
};

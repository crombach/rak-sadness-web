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
  id: string;
  name: string;
  shortName: string;
  date: string;
  competitions: Array<EspnCompetition>;
  status: EspnStatus;
  links?: Array<EspnLink>;
};

export type EspnLink = {
  href: string;
  text?: string;
};

export type EspnStatus = {
  type: {
    id: GameStatus;
    shortDetail: string;
  };
};

export type EspnCompetition = {
  competitors: Array<EspnCompetitor>;
  situation?: EspnSituation;
  date: string;
  venue?: EspnVenue;
};

export type EspnVenue = {
  fullName?: string;
  address?: {
    city?: string;
    state?: string;
  };
};

export type EspnCompetitor = {
  id: string;
  homeAway: HomeAway;
  team: EspnTeam;
  score: string;
  records?: Array<EspnRecord>;
  /** One entry per period played, in order. Absent before kickoff. */
  linescores?: Array<EspnLinescore>;
};

/** `type` tells the season record ("total") from the home and road splits. */
export type EspnRecord = {
  type?: string;
  summary?: string;
};

export type EspnLinescore = {
  value?: number;
};

export type EspnSituation = {
  downDistanceText?: string;
  possession: string; // Team ID
};

export type EspnTeam = {
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
};

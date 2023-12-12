export type EspnEvent = {
  name: string;
  shortName: string;
  competitions: Array<EspnCompetition>;
  status: EspnStatus;
};

export type EspnStatus = {
  type: {
    completed: boolean;
  };
};

export type EspnCompetition = {
  competitors: Array<EspnCompetitor>;
};

export type EspnCompetitor = {
  homeAway: "home" | "away";
  winner: boolean;
  team: EspnTeam;
  score: string;
};

export type EspnTeam = {
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
};

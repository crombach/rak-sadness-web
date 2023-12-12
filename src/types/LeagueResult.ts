type Team = {
  name: string;
  abbreviation: string;
};

export type LeagueResult = {
  name: string;
  shortName: string;
  isCompleted: boolean;
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
    by: number;
  };
  totalScore: number;
};

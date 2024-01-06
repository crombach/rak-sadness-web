export enum League {
  PRO = "nfl",
  COLLEGE = "college-football",
}

export enum SeasonType {
  REGULAR = 2,
  POST = 3,
  OFF = 4,
}

export type WeekInfo = {
  league: League;
  seasonType: SeasonType;
  value: number;
  startDate: Date;
  endDate: Date;
};

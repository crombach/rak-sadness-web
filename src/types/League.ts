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
  value: number;
  label: string;
  startDate: Date;
  endDate: Date;
};

export type LeagueCalendar = {
  seasonType: SeasonType;
  startDate: Date;
  endDate: Date;
  weeks: Array<{
    value: number;
    label: string;
    startDate: Date;
    endDate: Date;
  }>;
};

export type LeagueInfo = {
  league: League;
  activeCalendar: LeagueCalendar;
  activeWeek: WeekInfo;
  calendars: LeagueCalendar[];
};

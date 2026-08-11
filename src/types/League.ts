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
  /**
   * The year the season started in. A season runs into the following January, so
   * every week of the 2025 season is a 2025 week, including the ones played in
   * January 2026.
   */
  season: number;
  activeCalendar: LeagueCalendar;
  activeWeek: WeekInfo;
  calendars: LeagueCalendar[];
};

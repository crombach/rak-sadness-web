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
  /**
   * Every week the season can be scored on, regular season then postseason,
   * numbered straight through. The NFL's week 19 is the Wild Card round and its
   * week 23 is the Super Bowl, which is how a pool that runs past week 18 lines
   * up with ESPN's own numbering.
   */
  seasonWeeks: Array<WeekInfo>;
  activeCalendar: LeagueCalendar;
  activeWeek: WeekInfo;
  calendars: LeagueCalendar[];
};

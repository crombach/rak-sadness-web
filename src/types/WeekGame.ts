import { League } from "./League";
import { LeagueResult } from "./LeagueResult";

/** One picks column, and the game it was picked against. */
export type WeekGame = {
  /** The picks table's column label, `C1` or `P3`, which also names this game. */
  label: string;
  league: League;
  /** What the game is called where there is no result to name it after. */
  name: string;
  /** Absent where no ESPN event answered the teams this column was picked with. */
  result?: LeagueResult;
};

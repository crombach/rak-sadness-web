import { League } from "../../types/League";
import { LeagueResult } from "../../types/LeagueResult";
import { WeekGame } from "../../types/WeekGame";
import { matchesMatchup } from "../getLeagueResults";
import rangeWithPrefix from "../rangeWithPrefix";
import { LEAGUE_PREFIX, LEAGUES, LeagueKey } from "./gameColumns";
import { ParsedPicks } from "./parsePicksWorkbook";

const ESPN_LEAGUE: Record<LeagueKey, League> = {
  college: League.COLLEGE,
  pro: League.PRO,
};

/**
 * Every game the week's picks describe, in the order the picks table columns are.
 *
 * A column ESPN had no game for keeps its place, so a reader who clicked it is
 * told there is nothing behind it rather than being shown the wrong game.
 *
 * Positional labels rather than the workbook's own keys, because a sheet with two
 * `C1` headers reaches the second column as `C1_1` while the table titles it `C2`.
 * The key is only how the column's teams are looked up.
 */
export default function weekGames(
  parsed: Pick<ParsedPicks, "collegeKeys" | "proKeys" | "matchupsByGameKey">,
  results: Record<LeagueKey, Array<LeagueResult>>,
): Array<WeekGame> {
  return LEAGUES.flatMap((league) => {
    const keys = league === "college" ? parsed.collegeKeys : parsed.proKeys;
    const labels = rangeWithPrefix(keys.length, LEAGUE_PREFIX[league]);
    return keys.map((key, index) => {
      const teams = parsed.matchupsByGameKey.get(key);
      // First match wins, which is how the picks themselves are resolved, so a
      // team playing twice in a college bowl week lands on the same game here.
      const result =
        teams != null
          ? results[league].find((it) => matchesMatchup(it, teams))
          : undefined;
      return {
        label: labels[index],
        league: ESPN_LEAGUE[league],
        name:
          result?.shortName ??
          (teams != null && teams.size > 0
            ? [...teams].join(" / ")
            : labels[index]),
        result,
      };
    });
  });
}

import { League } from "../../types/League";
import { LeagueResult } from "../../types/LeagueResult";
import { finalGame } from "./leagueResultFixtures";
import weekGames from "./weekGames";

const michVsOsu = finalGame({
  home: "OSU",
  away: "MICH",
  homeScore: 20,
  awayScore: 30,
});
const bufVsKc = finalGame({
  home: "BUF",
  away: "KC",
  homeScore: 30,
  awayScore: 20,
});

function parsed({
  collegeKeys = [],
  proKeys = [],
  matchups = {},
}: {
  collegeKeys?: Array<string>;
  proKeys?: Array<string>;
  matchups?: Record<string, Array<string>>;
}) {
  return {
    collegeKeys,
    proKeys,
    matchupsByGameKey: new Map(
      Object.entries(matchups).map(([key, teams]) => [key, new Set(teams)]),
    ),
  };
}

describe("weekGames", () => {
  it("labels the college columns then the pro ones", () => {
    const games = weekGames(
      parsed({
        collegeKeys: ["C1"],
        proKeys: ["P1"],
        matchups: { C1: ["MICH", "OSU"], P1: ["BUF", "KC"] },
      }),
      { college: [michVsOsu], pro: [bufVsKc] },
    );
    expect(games.map((game) => game.label)).toEqual(["C1", "P1"]);
    expect(games.map((game) => game.league)).toEqual([
      League.COLLEGE,
      League.PRO,
    ]);
    expect(games.map((game) => game.result)).toEqual([michVsOsu, bufVsKc]);
  });

  it("names a game after the matchup ESPN listed", () => {
    const [game] = weekGames(
      parsed({ collegeKeys: ["C1"], matchups: { C1: ["MICH", "OSU"] } }),
      { college: [michVsOsu], pro: [] },
    );
    expect(game.name).toBe("MICH @ OSU");
  });

  it("resolves a column every player picked the same side of", () => {
    const [game] = weekGames(
      parsed({ proKeys: ["P1"], matchups: { P1: ["BUF"] } }),
      { college: [], pro: [bufVsKc] },
    );
    expect(game.result).toBe(bufVsKc);
  });

  it("keeps a column ESPN had no game for, named after its teams", () => {
    const games = weekGames(
      parsed({
        collegeKeys: ["C1", "C2"],
        matchups: { C1: ["MICH", "OSU"], C2: ["PSU", "IOWA"] },
      }),
      { college: [michVsOsu], pro: [] },
    );
    expect(games).toHaveLength(2);
    expect(games[1].result).toBeUndefined();
    expect(games[1].name).toBe("PSU / IOWA");
  });

  it("keeps a column nobody picked, named after itself", () => {
    const games = weekGames(parsed({ collegeKeys: ["C1"] }), {
      college: [michVsOsu],
      pro: [],
    });
    expect(games[0]).toMatchObject({
      label: "C1",
      name: "C1",
      result: undefined,
    });
  });

  it("labels a repeated header by its position, not by its workbook key", () => {
    const games = weekGames(
      parsed({
        collegeKeys: ["C1", "C1_1"],
        matchups: { C1: ["MICH", "OSU"], C1_1: ["BUF", "KC"] },
      }),
      { college: [michVsOsu, bufVsKc], pro: [] },
    );
    expect(games.map((game) => game.label)).toEqual(["C1", "C2"]);
    expect(games[1].result).toBe(bufVsKc);
  });

  it("takes the first game a team playing twice appears in", () => {
    // College results arrive latest first, which is the game a bowl week is about.
    const laterBowl: LeagueResult = {
      ...finalGame({ home: "OSU", away: "PSU", homeScore: 7, awayScore: 3 }),
      shortName: "PSU @ OSU",
    };
    const [game] = weekGames(
      parsed({ collegeKeys: ["C1"], matchups: { C1: ["OSU"] } }),
      { college: [laterBowl, michVsOsu], pro: [] },
    );
    expect(game.result).toBe(laterBowl);
  });
});

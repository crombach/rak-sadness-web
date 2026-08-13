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
  rows = [],
  inconsistent = [],
}: {
  collegeKeys?: Array<string>;
  proKeys?: Array<string>;
  matchups?: Record<string, Array<string>>;
  /** The picks themselves, which is where a game's spread is written. */
  rows?: Array<Record<string, string>>;
  inconsistent?: Array<string>;
}) {
  return {
    rows,
    collegeKeys,
    proKeys,
    matchupsByGameKey: new Map(
      Object.entries(matchups).map(([key, teams]) => [key, new Set(teams)]),
    ),
    inconsistentSpreadGames: new Map(
      inconsistent.map((key) => [key, "Picks disagree about the spread."]),
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

  it("says a game played at neither ground the way it says every other one", () => {
    // ESPN calls a neutral-site game `A VS B`, which a bowl week is full of.
    const bowl: LeagueResult = { ...michVsOsu, shortName: "MICH VS OSU" };
    const [game] = weekGames(
      parsed({ collegeKeys: ["C1"], matchups: { C1: ["MICH", "OSU"] } }),
      { college: [bowl], pro: [] },
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

  it("reads the pool's line off the picks, from the favored side", () => {
    const [game] = weekGames(
      parsed({
        proKeys: ["P1"],
        matchups: { P1: ["BUF", "KC"] },
        rows: [{ P1: "BUF -3" }, { P1: "KC +3" }],
      }),
      { college: [], pro: [bufVsKc] },
    );
    expect(game.spread).toEqual({ team: "BUF", points: -3 });
  });

  it("turns a line written from the underdog's side around", () => {
    const [game] = weekGames(
      parsed({
        proKeys: ["P1"],
        matchups: { P1: ["BUF", "KC"] },
        rows: [{ P1: "KC +3.5" }, { P1: "BUF -3.5" }],
      }),
      { college: [], pro: [bufVsKc] },
    );
    // Named after the game ESPN listed, since the row that decided it named the
    // other team.
    expect(game.spread).toEqual({ team: "BUF", points: -3.5 });
  });

  it("carries no line for a game the picks put none on", () => {
    const [game] = weekGames(
      parsed({
        proKeys: ["P1"],
        matchups: { P1: ["BUF", "KC"] },
        rows: [{ P1: "BUF" }, { P1: "KC" }],
      }),
      { college: [], pro: [bufVsKc] },
    );
    expect(game.spread).toBeUndefined();
  });

  it("carries no line for a game the picks disagree about", () => {
    const [game] = weekGames(
      parsed({
        proKeys: ["P1"],
        matchups: { P1: ["BUF", "KC"] },
        rows: [{ P1: "BUF -3" }, { P1: "KC +7" }],
        inconsistent: ["P1"],
      }),
      { college: [], pro: [bufVsKc] },
    );
    // Nothing can tell which of the two numbers was meant, so the game carries none.
    expect(game.spread).toBeUndefined();
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

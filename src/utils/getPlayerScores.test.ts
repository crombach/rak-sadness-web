import * as XLSX from "xlsx-js-style";
import { League, WeekInfo } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";
import { getLeagueResults } from "./getLeagueResults";
import { getPlayerScores } from "./getPlayerScores";
import { finalGame, upcomingGame } from "./leagueResultFixtures";

vi.mock("./getLeagueResults");

const mockGetLeagueResults = vi.mocked(getLeagueResults);

const WEEK: WeekInfo = {
  value: 5,
  label: "Week 5",
  startDate: new Date("2024-10-01T00:00:00Z"),
  endDate: new Date("2024-10-08T00:00:00Z"),
};

const osuBeatMichBy10 = finalGame({
  home: "OSU",
  away: "MICH",
  homeScore: 31,
  awayScore: 21,
});
const bufBeatKcBy10 = finalGame({
  home: "BUF",
  away: "KC",
  homeScore: 30,
  awayScore: 20,
});
const bufVsKcUpcoming = upcomingGame({ home: "BUF", away: "KC" });
// The tiebreaker game. 41 combined points.
const dalBeatPhiBy7 = finalGame({
  home: "DAL",
  away: "PHI",
  homeScore: 24,
  awayScore: 17,
});
const TIEBREAKER_TOTAL = 41;

/**
 * Column order matters. `getPlayerScores` treats the column immediately before
 * `Pts` as the tiebreaker game, so `P2` is the tiebreaker throughout this file.
 */
type PickRow = {
  Name: string;
  C1?: string;
  P1?: string;
  P2?: string;
  Pts?: number;
};

function picksBuffer(rows: Array<PickRow>, sheetName = "Picks"): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    sheetName,
  );
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

/** P1 has not kicked off, so the leader still has one game outstanding. */
function withP1Upcoming() {
  mockGetLeagueResults.mockImplementation(async (league: League) =>
    league === League.COLLEGE
      ? [osuBeatMichBy10]
      : [bufVsKcUpcoming, dalBeatPhiBy7],
  );
}

/** Every game is final, so nothing is outstanding and no one can catch up. */
function withEverythingFinal() {
  mockGetLeagueResults.mockImplementation(async (league: League) =>
    league === League.COLLEGE
      ? [osuBeatMichBy10]
      : [bufBeatKcBy10, dalBeatPhiBy7],
  );
}

function namesOf(scores: Array<{ name: string }>): Array<string> {
  return scores.map((score) => score.name);
}

beforeEach(() => {
  withP1Upcoming();
});

describe("getPlayerScores, spreadsheet parsing", () => {
  it("returns one entry per player row", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", C1: "MICH +3", P1: "KC +7", P2: "PHI +3", Pts: 45 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Alice", "Bob"]);
  });

  it("reads C columns as college and P columns as pro, excluding Pts", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.scores[0].college.map((it) => it.pick)).toEqual(["OSU -3"]);
    expect(result.scores[0].pro.map((it) => it.pick)).toEqual([
      "BUF -7",
      "DAL -3",
    ]);
  });

  it("derives each game's matchup from every player's pick", async () => {
    await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", C1: "MICH +3", P1: "KC +7", P2: "PHI +3", Pts: 45 },
      ]),
    );
    expect(mockGetLeagueResults).toHaveBeenCalledWith(League.COLLEGE, WEEK, [
      new Set(["OSU", "MICH"]),
    ]);
    expect(mockGetLeagueResults).toHaveBeenCalledWith(League.PRO, WEEK, [
      new Set(["BUF", "KC"]),
      new Set(["DAL", "PHI"]),
    ]);
  });

  it("reads the first sheet in the workbook, whatever it is named", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
      "Week 5 Picks",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["ignored"]]),
      "Notes",
    );
    const result = await getPlayerScores(
      WEEK,
      XLSX.write(workbook, { bookType: "xlsx", type: "array" }),
    );
    expect(namesOf(result.scores)).toEqual(["Alice"]);
  });
});

describe("getPlayerScores, scoring", () => {
  it("splits the total into college and pro", async () => {
    withEverythingFinal();
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.scores[0].score).toEqual({
      total: 3,
      college: 1,
      pro: 2,
      proAgainstTheSpread: 2,
    });
  });

  it("leaves games that are not final out of the score", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.scores[0].score.pro).toBe(1);
    expect(result.scores[0].pro[0].status).toBe("incomplete");
    expect(result.scores[0].pro[1].status).toBe("yes");
  });

  it("counts only pro picks that carry a spread toward the ATS score", async () => {
    withEverythingFinal();
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.scores[0].score.pro).toBe(2);
    expect(result.scores[0].score.proAgainstTheSpread).toBe(1);
  });

  it("marks a pick whose game is missing as an error", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "MIA -3", Pts: 41 },
      ]),
    );
    expect(result.scores[0].pro[1].status).toBe("error");
  });
});

describe("getPlayerScores, tiebreaker", () => {
  it("uses the combined score of the game in the column before Pts", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.tiebreaker).toBe(TIEBREAKER_TOTAL);
  });

  it("reports each player's distance from that combined score", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", C1: "MICH +3", P1: "KC +7", P2: "PHI +3", Pts: 45 },
      ]),
    );
    const distances = Object.fromEntries(
      result.scores.map((score) => [score.name, score.tiebreaker.distance]),
    );
    expect(distances).toEqual({ Alice: 0, Bob: 4 });
  });

  it("leaves the tiebreaker undefined while its game is unfinished", async () => {
    mockGetLeagueResults.mockImplementation(async (league: League) =>
      league === League.COLLEGE
        ? [osuBeatMichBy10]
        : [bufBeatKcBy10, upcomingGame({ home: "DAL", away: "PHI" })],
    );
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.tiebreaker).toBeUndefined();
    expect(result.scores[0].tiebreaker.distance).toBeUndefined();
  });
});

describe("getPlayerScores, ranking", () => {
  it("ranks by total score, highest first", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Bob", C1: "MICH +3", P1: "KC +7", P2: "PHI +3", Pts: 45 },
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Alice", "Bob"]);
  });

  it("breaks a tie on total score by tiebreaker distance", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Cara", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 45 },
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Alice", "Cara"]);
  });

  it("breaks a tie on distance by college score", async () => {
    withEverythingFinal();
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        // College 0, pro 2.
        { Name: "Dan", C1: "MICH +3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        // College 1, pro 1.
        { Name: "Alice", C1: "OSU -3", P1: "KC +7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Alice", "Dan"]);
  });

  it("breaks a tie on college score by pro score against the spread", async () => {
    withEverythingFinal();
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        // Correct pro pick carries no spread, so it earns no ATS point.
        { Name: "Frank", C1: "OSU -3", P1: "BUF", P2: "PHI +3", Pts: 41 },
        { Name: "Erin", C1: "OSU -3", P1: "BUF -7", P2: "PHI +3", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Erin", "Frank"]);
  });

  it("falls back to alphabetical order", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Zoe", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "amy", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["amy", "Zoe"]);
  });

  it("ranks players who submitted no picks last", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", Pts: 41 },
      ]),
    );
    expect(namesOf(result.scores)).toEqual(["Alice", "Bob"]);
    expect(result.scores[1].status.hasNoPicks).toBe(true);
  });
});

describe("getPlayerScores, knockouts", () => {
  it("does not knock out the leader", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", C1: "MICH +3", P1: "BUF -7", P2: "PHI +3", Pts: 45 },
      ]),
    );
    expect(result.scores[0].status.isKnockedOut).toBe(false);
    expect(result.scores[0].status.explanation).toBe("Winner!");
  });

  it("knocks out a player whose remaining picks cannot close the gap", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        // Two points behind with only one outstanding game, and that pick
        // matches Alice's, so there is no way to gain ground on her.
        { Name: "Bob", C1: "MICH +3", P1: "BUF -7", P2: "PHI +3", Pts: 45 },
      ]),
    );
    expect(result.scores[1].status.isKnockedOut).toBe(true);
    expect(result.scores[1].status.explanation).toBe(
      "Knocked out on Total Score by Alice. Behind by 2 with 0 different picks remaining.",
    );
  });

  it("keeps a player alive when a different remaining pick can still tie", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 45 },
        // One point behind, one outstanding game picked the other way, and a
        // closer tiebreaker guess than Alice's.
        { Name: "Gina", C1: "MICH +3", P1: "KC +7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(result.scores[1].name).toBe("Gina");
    expect(result.scores[1].status.isKnockedOut).toBe(false);
  });

  it("knocks out a player who can only tie and has the worse tiebreaker", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Hank", C1: "MICH +3", P1: "KC +7", P2: "DAL -3", Pts: 45 },
      ]),
    );
    expect(result.scores[1].name).toBe("Hank");
    expect(result.scores[1].status.isKnockedOut).toBe(true);
    expect(result.scores[1].status.explanation).toContain(
      "Knocked out on MNF Points tiebreaker by Alice",
    );
  });

  it("knocks out a player who submitted no picks", async () => {
    const result = await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
        { Name: "Bob", Pts: 41 },
      ]),
    );
    expect(result.scores[1].status.isKnockedOut).toBe(true);
    expect(result.scores[1].status.explanation).toBe(
      "Knocked out due to having no picks.",
    );
  });
});

describe("getPlayerScores, league requests", () => {
  it("asks for both leagues for the given week", async () => {
    const collegeOnly: Array<LeagueResult> = [osuBeatMichBy10];
    mockGetLeagueResults.mockImplementation(async (league: League) =>
      league === League.COLLEGE ? collegeOnly : [bufBeatKcBy10, dalBeatPhiBy7],
    );
    await getPlayerScores(
      WEEK,
      picksBuffer([
        { Name: "Alice", C1: "OSU -3", P1: "BUF -7", P2: "DAL -3", Pts: 41 },
      ]),
    );
    expect(mockGetLeagueResults).toHaveBeenCalledTimes(2);
    const leagues = mockGetLeagueResults.mock.calls.map((call) => call[0]);
    expect(leagues).toContain(League.COLLEGE);
    expect(leagues).toContain(League.PRO);
  });
});

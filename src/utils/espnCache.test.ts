import { GameStatus } from "../types/ESPN";
import { League } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";
import { finalGame } from "./scoring/leagueResultFixtures";
import {
  isSettled,
  matchupKey,
  readCachedCalendar,
  readCachedResults,
  writeCachedCalendar,
  writeCachedResults,
} from "./espnCache";

const SEASON = 2025;
const BUF_KC = "BUF|KC";

function game(): LeagueResult {
  return finalGame({ home: "BUF", away: "KC", homeScore: 30, awayScore: 20 });
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("matchupKey", () => {
  it("names the same two teams the same way around either way", () => {
    expect(matchupKey(new Set(["KC", "BUF"]))).toBe(BUF_KC);
    expect(matchupKey(new Set(["BUF", "KC"]))).toBe(BUF_KC);
  });

  it("folds the case the workbook happened to use", () => {
    expect(matchupKey(new Set(["buf", "Kc"]))).toBe(BUF_KC);
  });

  it("names a column with one team, and one with none", () => {
    expect(matchupKey(new Set(["BUF"]))).toBe("BUF");
    expect(matchupKey(new Set())).toBe("");
  });
});

describe("isSettled", () => {
  it("holds a game that has been played, and a matchup with no game", () => {
    expect(isSettled(game())).toBe(true);
    expect(isSettled(null)).toBe(true);
  });

  it("holds nothing about a game still being played", () => {
    expect(isSettled({ ...game(), status: GameStatus.LIVE })).toBe(false);
  });
});

describe("espnCache, results", () => {
  it("reads back a game and a hole, the date a date again", () => {
    writeCachedResults(SEASON, 3, League.PRO, {
      [BUF_KC]: game(),
      "PHI|DAL": null,
    });

    const held = readCachedResults(SEASON, 3, League.PRO);

    expect(held[BUF_KC]?.date).toEqual(game().date);
    expect(held[BUF_KC]?.date).toBeInstanceOf(Date);
    expect(held["PHI|DAL"]).toBeNull();
    // A hole is an answer, so telling one from a matchup never asked about is what
    // says whether the week still has anything to fetch.
    expect("PHI|DAL" in held).toBe(true);
    expect("OSU|MICH" in held).toBe(false);
  });

  it("keeps each league, week, and season apart", () => {
    writeCachedResults(SEASON, 3, League.PRO, { [BUF_KC]: game() });

    expect(readCachedResults(SEASON, 3, League.COLLEGE)).toEqual({});
    expect(readCachedResults(SEASON, 4, League.PRO)).toEqual({});
    expect(readCachedResults(2024, 3, League.PRO)).toEqual({});
  });

  it("drops whatever it held for a week it is asked to hold again", () => {
    writeCachedResults(SEASON, 3, League.PRO, { [BUF_KC]: game() });
    writeCachedResults(SEASON, 3, League.PRO, { "PHI|DAL": null });

    expect(readCachedResults(SEASON, 3, League.PRO)).toEqual({
      "PHI|DAL": null,
    });
  });

  it("treats an entry it cannot read as a miss", () => {
    localStorage.setItem(`rak-madness:espn:results:${SEASON}:3:nfl`, "!!!");

    expect(readCachedResults(SEASON, 3, League.PRO)).toEqual({});
  });

  it("treats an entry an older version wrote as a miss", () => {
    localStorage.setItem(
      `rak-madness:espn:results:${SEASON}:3:nfl`,
      JSON.stringify({ version: 0, games: { [BUF_KC]: game() } }),
    );

    expect(readCachedResults(SEASON, 3, League.PRO)).toEqual({});
  });

  it("caps how many weeks it holds, keeping the one just written", () => {
    [1, 2, 3, 4, 5, 6, 7].forEach((week) =>
      writeCachedResults(SEASON, week, League.PRO, { [BUF_KC]: game() }),
    );

    expect(readCachedResults(SEASON, 7, League.PRO)[BUF_KC]).not.toBeNull();
    const held = [1, 2, 3, 4, 5, 6, 7].filter(
      (week) =>
        Object.keys(readCachedResults(SEASON, week, League.PRO)).length > 0,
    );
    expect(held).toHaveLength(6);
  });
});

describe("espnCache, calendars", () => {
  it("reads back the answer it was given", () => {
    writeCachedCalendar(League.PRO, 2022, { leagues: [{ slug: "nfl" }] });

    expect(readCachedCalendar(League.PRO, 2022)).toEqual({
      leagues: [{ slug: "nfl" }],
    });
  });

  it("keeps each league and season apart", () => {
    writeCachedCalendar(League.PRO, 2022, { leagues: [] });

    expect(readCachedCalendar(League.COLLEGE, 2022)).toBeUndefined();
    expect(readCachedCalendar(League.PRO, 2023)).toBeUndefined();
  });
});

describe("espnCache, storage that will not have it", () => {
  it("leaves nothing behind when a write is rejected", () => {
    writeCachedResults(SEASON, 3, League.PRO, { [BUF_KC]: game() });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    writeCachedResults(SEASON, 4, League.PRO, { [BUF_KC]: game() });

    expect(readCachedResults(SEASON, 3, League.PRO)).toEqual({});
    expect(readCachedResults(SEASON, 4, League.PRO)).toEqual({});
  });

  it("misses rather than throws when every localStorage method throws", () => {
    const blocked = () => {
      throw new Error("storage blocked");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "key").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "length", "get").mockImplementation(blocked);

    expect(readCachedResults(SEASON, 3, League.PRO)).toEqual({});
    expect(() =>
      writeCachedResults(SEASON, 3, League.PRO, { [BUF_KC]: game() }),
    ).not.toThrow();
    expect(readCachedCalendar(League.PRO, 2022)).toBeUndefined();
    expect(() => writeCachedCalendar(League.PRO, 2022, {})).not.toThrow();
  });
});

import { Mock } from "vitest";
import { EspnEvent, GameStatus, HomeAway } from "../types/ESPN";
import { League, WeekInfo } from "../types/League";
import { getLeagueResults } from "./getLeagueResults";

const WEEK: WeekInfo = {
  value: 5,
  label: "Week 5",
  startDate: new Date("2024-10-01T00:00:00Z"),
  endDate: new Date("2024-10-08T00:00:00Z"),
};

const GAME_DATE = "2024-10-06T17:00Z";

function competitor(
  abbreviation: string,
  homeAway: HomeAway,
  score: number,
  id = abbreviation,
) {
  return {
    id,
    homeAway,
    winner: false,
    team: {
      displayName: `${abbreviation} Team`,
      shortDisplayName: abbreviation,
      abbreviation,
    },
    score: String(score),
  };
}

function espnEvent({
  home,
  away,
  homeScore = 30,
  awayScore = 20,
  status = GameStatus.FINAL,
  date = GAME_DATE,
  situation,
}: {
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status?: GameStatus;
  date?: string;
  situation?: { downDistanceText?: string; possession: string };
}): EspnEvent {
  return {
    name: `${away} Team at ${home} Team`,
    shortName: `${away} @ ${home}`,
    date,
    status: {
      type: {
        id: status,
        detail: "detail",
        shortDetail: status === GameStatus.FINAL ? "Final" : "3rd Quarter",
      },
    },
    competitions: [
      {
        competitors: [
          competitor(home, HomeAway.HOME, homeScore),
          competitor(away, HomeAway.AWAY, awayScore),
        ],
        situation: situation as never,
        date,
      },
    ],
  };
}

/** Every fetch resolves to the same event list. */
function mockFetch(events: Array<EspnEvent>) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ events }) });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function urlsOf(fetchMock: Mock): Array<string> {
  return fetchMock.mock.calls.map((call) => call[0]);
}

const bufVsKc = espnEvent({ home: "BUF", away: "KC" });
const BUF_KC = new Set(["BUF", "KC"]);

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getLeagueResults, pro requests", () => {
  it("requests the regular season week as given", async () => {
    const fetchMock = mockFetch([bufVsKc]);
    await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(urlsOf(fetchMock)).toEqual([
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=5&seasontype=2",
    ]);
  });

  it("asks for a past season by the year it started in", async () => {
    const fetchMock = mockFetch([bufVsKc]);
    await getLeagueResults(League.PRO, WEEK, [BUF_KC], 2022);
    expect(urlsOf(fetchMock)).toEqual([
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=5&seasontype=2&dates=2022",
    ]);
  });

  it("wraps a postseason week back to a postseason week number", async () => {
    const fetchMock = mockFetch([bufVsKc]);
    await getLeagueResults(League.PRO, { ...WEEK, value: 20 }, [BUF_KC]);
    expect(urlsOf(fetchMock)[0]).toContain("week=2&seasontype=3");
  });
});

describe("getLeagueResults, college requests", () => {
  it("shifts the week forward by one and asks for both groups", async () => {
    const fetchMock = mockFetch([espnEvent({ home: "OSU", away: "MICH" })]);
    await getLeagueResults(League.COLLEGE, WEEK, [new Set(["OSU", "MICH"])]);
    expect(urlsOf(fetchMock)).toEqual([
      "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?week=6&seasontype=2&limit=400&groups=80",
      "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?week=6&seasontype=2&limit=400&groups=22",
    ]);
  });

  it("collapses the whole postseason into week 1", async () => {
    const fetchMock = mockFetch([espnEvent({ home: "OSU", away: "MICH" })]);
    await getLeagueResults(League.COLLEGE, { ...WEEK, value: 16 }, [
      new Set(["OSU", "MICH"]),
    ]);
    expect(urlsOf(fetchMock)[0]).toContain("week=1&seasontype=3");
  });

  it("drops events that kicked off before the week started", async () => {
    mockFetch([
      espnEvent({ home: "OSU", away: "MICH", date: "2024-09-20T17:00Z" }),
      espnEvent({ home: "PSU", away: "IOWA" }),
    ]);
    const results = await getLeagueResults(League.COLLEGE, WEEK, [
      new Set(["OSU", "MICH"]),
      new Set(["PSU", "IOWA"]),
    ]);
    expect(results.map((it) => it.shortName)).toEqual([
      "IOWA @ PSU",
      "IOWA @ PSU",
    ]);
  });

  it("returns the latest game first", async () => {
    mockFetch([
      espnEvent({ home: "OSU", away: "MICH", date: "2024-10-02T17:00Z" }),
      espnEvent({ home: "PSU", away: "IOWA", date: "2024-10-05T17:00Z" }),
    ]);
    const results = await getLeagueResults(League.COLLEGE, WEEK, [
      new Set(["OSU", "MICH"]),
      new Set(["PSU", "IOWA"]),
    ]);
    expect(results.map((it) => it.shortName)[0]).toBe("IOWA @ PSU");
  });
});

describe("getLeagueResults, mapping", () => {
  it("maps an event onto a league result", async () => {
    mockFetch([bufVsKc]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(result).toMatchObject({
      name: "KC Team at BUF Team",
      shortName: "KC @ BUF",
      date: new Date(GAME_DATE),
      status: GameStatus.FINAL,
      detailMessage: "Final",
      home: { team: { name: "BUF Team", abbreviation: "BUF" }, score: 30 },
      away: { team: { name: "KC Team", abbreviation: "KC" }, score: 20 },
      totalScore: 50,
    });
  });

  it("uppercases team abbreviations", async () => {
    mockFetch([espnEvent({ home: "buf", away: "kc" })]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [
      new Set(["buf", "kc"]),
    ]);
    expect(result.home.team.abbreviation).toBe("BUF");
    expect(result.away.team.abbreviation).toBe("KC");
  });

  it("records the winner, the loser, and the margin", async () => {
    mockFetch([bufVsKc]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(result.winner.team?.abbreviation).toBe("BUF");
    expect(result.winner.homeAway).toBe(HomeAway.HOME);
    expect(result.loser.team?.abbreviation).toBe("KC");
    expect(result.winner.by).toBe(10);
  });

  it("leaves the winner unset for a tie", async () => {
    mockFetch([espnEvent({ home: "BUF", away: "KC", awayScore: 30 })]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(result.winner.team).toBeNull();
    expect(result.loser.team).toBeNull();
  });

  it("leaves the winner unset while the game is live", async () => {
    mockFetch([
      espnEvent({ home: "BUF", away: "KC", status: GameStatus.LIVE }),
    ]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(result.status).toBe(GameStatus.LIVE);
    expect(result.winner.team).toBeNull();
    expect(result.detailMessage).toBe("3rd Quarter");
  });

  it("reads down and distance and which side has the ball", async () => {
    mockFetch([
      espnEvent({
        home: "BUF",
        away: "KC",
        status: GameStatus.LIVE,
        situation: { downDistanceText: "2nd & 7", possession: "KC" },
      }),
    ]);
    const [result] = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(result.possession).toEqual({
      downDistanceText: "2nd & 7",
      homeAway: HomeAway.AWAY,
    });
  });
});

describe("getLeagueResults, matchup filtering", () => {
  it("drops games nobody picked", async () => {
    mockFetch([bufVsKc, espnEvent({ home: "DAL", away: "PHI" })]);
    const results = await getLeagueResults(League.PRO, WEEK, [BUF_KC]);
    expect(results.map((it) => it.shortName)).toEqual(["KC @ BUF"]);
  });

  it("keeps a game when a one-sided matchup names either team", async () => {
    mockFetch([bufVsKc]);
    const results = await getLeagueResults(League.PRO, WEEK, [new Set(["KC"])]);
    expect(results).toHaveLength(1);
  });

  it("drops every game when a matchup names no teams", async () => {
    mockFetch([bufVsKc]);
    const results = await getLeagueResults(League.PRO, WEEK, [
      new Set<string>(),
    ]);
    expect(results).toHaveLength(0);
  });
});

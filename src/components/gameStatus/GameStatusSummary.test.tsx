import { fireEvent, render, screen } from "@testing-library/react";
import { GameStatus, HomeAway } from "../../types/ESPN";
import { LeagueResult } from "../../types/LeagueResult";
import { League } from "../../types/League";
import { WeekGame } from "../../types/WeekGame";
import GameStatusSummary from "./GameStatusSummary";

const KICKOFF = new Date("2024-10-06T17:00:00Z");

function game(result?: LeagueResult): WeekGame {
  return {
    label: "P1",
    league: League.PRO,
    name: result?.shortName ?? "KC / BUF",
    result,
  };
}

function result(over: Partial<LeagueResult> = {}): LeagueResult {
  return {
    id: "401",
    name: "Kansas City Chiefs at Buffalo Bills",
    shortName: "KC @ BUF",
    date: KICKOFF,
    status: GameStatus.FINAL,
    detailMessage: "Final",
    home: {
      team: {
        name: "Buffalo Bills",
        abbreviation: "BUF",
        logoUrl: "https://espn.com/buf.png",
      },
      score: 30,
      record: "4-1",
      linescores: [7, 10, 3, 10],
    },
    away: {
      team: {
        name: "Kansas City Chiefs",
        abbreviation: "KC",
        logoUrl: "https://espn.com/kc.png",
      },
      score: 20,
      record: "3-2",
      linescores: [7, 3, 10, 0],
    },
    venue: { name: "Highmark Stadium", city: "Orchard Park", state: "NY" },
    possession: {},
    winner: {
      team: { name: "Buffalo Bills", abbreviation: "BUF" },
      homeAway: HomeAway.HOME,
      by: 10,
    },
    loser: {
      team: { name: "Kansas City Chiefs", abbreviation: "KC" },
      homeAway: HomeAway.AWAY,
      by: 10,
    },
    totalScore: 50,
    ...over,
  };
}

/*
 * The wireframe's bars and the teams' marks, neither of which any query reaches: a
 * bar has nothing in it to read, and a mark is decorative beside the name it stands
 * next to.
 */
function bars(): number {
  return document.querySelectorAll(".game-status__bar").length;
}

function logos(): Array<string | null> {
  return [...document.querySelectorAll("img")].map((logo) =>
    logo.getAttribute("src"),
  );
}

describe("GameStatusSummary, before there is anything to show", () => {
  it("draws nothing with no game chosen", () => {
    const { container } = render(<GameStatusSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stands a wireframe in until the game has been fetched", () => {
    render(<GameStatusSummary game={game(result())} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the game");
    expect(bars()).toBeGreaterThan(0);
  });

  it("stands a wireframe in over the game before it while one is fetched", () => {
    render(
      <GameStatusSummary game={game(result())} result={result()} isLoading />,
    );
    expect(screen.queryByText("Buffalo Bills")).toBeNull();
    expect(bars()).toBeGreaterThan(0);
  });

  it("says so where ESPN listed no game for the column", () => {
    render(<GameStatusSummary game={game()} />);
    expect(screen.getByText(/No game was found for P1/)).toHaveTextContent(
      "KC / BUF",
    );
    expect(bars()).toBe(0);
  });
});

describe("GameStatusSummary, a game that is over", () => {
  const renderFinal = () =>
    render(<GameStatusSummary game={game(result())} result={result()} />);

  it("names both sides in full, with their records and which is home", () => {
    renderFinal();
    expect(screen.getByText("Kansas City Chiefs")).toBeInTheDocument();
    expect(screen.getByText("Buffalo Bills")).toBeInTheDocument();
    expect(screen.getByText("Away")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("3-2")).toBeInTheDocument();
    expect(screen.getByText("4-1")).toBeInTheDocument();
  });

  it("heads the scoreline with the venue", () => {
    renderFinal();
    // Each part on its own, since a dot between two of them is the stylesheet's.
    expect(screen.getByText("Highmark Stadium")).toBeInTheDocument();
    expect(screen.getByText("Orchard Park, NY")).toBeInTheDocument();
  });

  it("says FT/OT, and nothing about how the quarters went", () => {
    renderFinal();
    expect(screen.getByText("FT")).toBeInTheDocument();
    // The pool is scored on the result, so a quarter's points are nobody's business.
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("marks neither side, the ball being nobody's once the game is over", () => {
    renderFinal();
    expect(screen.queryByLabelText("Has the ball")).toBeNull();
  });

  it("stands the home side on the left", () => {
    renderFinal();
    expect(
      [...document.querySelectorAll(".game-status__side")].map(
        (side) => side.className,
      ),
    ).toEqual(["game-status__side --home", "game-status__side --away"]);
  });

  it("carries each side's abbreviation, which is what a phone shows", () => {
    renderFinal();
    const short = [...document.querySelectorAll(".game-status__name-short")];
    expect(short.map((it) => it.textContent)).toEqual(["BUF", "KC"]);
    // The name is the one read out, so the abbreviation beside it is not heard twice.
    short.forEach((it) => expect(it).toHaveAttribute("aria-hidden", "true"));
  });

  it("wears both teams' marks, home first", () => {
    renderFinal();
    expect(logos()).toEqual([
      "https://espn.com/buf.png",
      "https://espn.com/kc.png",
    ]);
  });
});

/*
 * `TZ` is what `toLocaleDateString` reads the zone from, and Node picks a change to it
 * up on the next call. Set here so the kickoff asserted is the same wherever the suite
 * is run, which the developers' machines and CI do not agree on.
 */
describe("GameStatusSummary, the kickoff", () => {
  const zone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = zone;
  });

  function kickoff(timeZone: string): Array<string | null> {
    process.env.TZ = timeZone;
    render(<GameStatusSummary game={game(result())} result={result()} />);
    return [
      ...document.querySelectorAll(".game-status__meta-group:first-child span"),
    ].map((part) => part.textContent);
  }

  it("says the day and the time in the reader's own zone, and names it", () => {
    // 17:00 UTC, which is the morning where this reader is.
    expect(kickoff("America/Los_Angeles")).toEqual([
      "Sun, Oct 6",
      "10:00 AM PDT",
    ]);
  });

  it("moves the day with the zone, not only the time", () => {
    // The same instant, on which this reader is already into Monday.
    expect(kickoff("Australia/Sydney")).toEqual([
      "Mon, Oct 7",
      "4:00 AM GMT+11",
    ]);
  });
});

describe("GameStatusSummary, a team with no mark", () => {
  it("drops both marks where either team has none", () => {
    const oneLogo = result({
      away: {
        team: { name: "Kansas City Chiefs", abbreviation: "KC" },
        score: 20,
        record: "3-2",
        linescores: [7, 3, 10, 0],
      },
    });
    render(<GameStatusSummary game={game(oneLogo)} result={oneLogo} />);
    expect(logos()).toEqual([]);
  });

  it("drops both marks where one of them fails to load", () => {
    render(<GameStatusSummary game={game(result())} result={result()} />);
    fireEvent.error(document.querySelectorAll("img")[0]);
    expect(logos()).toEqual([]);
  });
});

describe("GameStatusSummary, a game still being played", () => {
  const live = result({
    status: GameStatus.LIVE,
    detailMessage: "8:42 - 3rd Quarter",
    period: 3,
    clock: "8:42",
    possession: { homeAway: HomeAway.AWAY, downDistanceText: "2nd & 7" },
    winner: { team: null, homeAway: null, by: 10 },
    loser: { team: null, homeAway: null, by: 10 },
  });

  const renderLive = () =>
    render(<GameStatusSummary game={game(live)} result={live} />);

  it("shows the clock, the quarter, and the down", () => {
    renderLive();
    // The quarter as `Q3` on every screen, rather than ESPN's own longer wording.
    expect(screen.getByText("Q3 8:42")).toBeInTheDocument();
    expect(screen.queryByText("8:42 - 3rd Quarter")).toBeNull();
    expect(screen.getByText("2nd & 7")).toBeInTheDocument();
  });

  it("says who has the ball with the marker alone", () => {
    renderLive();
    expect(screen.getByLabelText("Has the ball")).toBeInTheDocument();
    expect(screen.queryByText("KC ball")).toBeNull();
  });

  it("marks the side with the ball", () => {
    renderLive();
    expect(screen.getByLabelText("Has the ball")).toBeInTheDocument();
  });
});

describe("GameStatusSummary, a game yet to kick off", () => {
  it("says it is yet to start, leaving the kickoff to the strip above", () => {
    const upcoming = result({
      status: GameStatus.UPCOMING,
      detailMessage: "Sun, October 6th - 1:00 PM EDT",
      home: {
        team: { name: "Buffalo Bills", abbreviation: "BUF" },
        score: 0,
        linescores: [],
      },
      away: {
        team: { name: "Kansas City Chiefs", abbreviation: "KC" },
        score: 0,
        linescores: [],
      },
      winner: { team: null, homeAway: null, by: 0 },
      loser: { team: null, homeAway: null, by: 0 },
    });
    render(<GameStatusSummary game={game(upcoming)} result={upcoming} />);
    expect(screen.getByText("Pregame")).toBeInTheDocument();
    // ESPN says a scheduled game as its kickoff, in Eastern time. Shown here it
    // would be the strip above said twice, and said in the wrong zone.
    expect(screen.queryByText("Sun, October 6th - 1:00 PM EDT")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByLabelText("Has the ball")).toBeNull();
  });

  it("keeps ESPN's word for a stage it has no short form for", () => {
    const postponed = result({
      // Neither of the three the app knows, which is how ESPN says a game called off.
      status: "5" as GameStatus,
      detailMessage: "Postponed",
      home: {
        team: { name: "Buffalo Bills", abbreviation: "BUF" },
        score: 0,
        linescores: [],
      },
      away: {
        team: { name: "Kansas City Chiefs", abbreviation: "KC" },
        score: 0,
        linescores: [],
      },
    });
    render(<GameStatusSummary game={game(postponed)} result={postponed} />);
    expect(screen.getByText("Postponed")).toBeInTheDocument();
  });

  it("says a game that needed overtime went to it", () => {
    const overtime = result({
      detailMessage: "Final/OT",
      home: {
        team: { name: "Buffalo Bills", abbreviation: "BUF" },
        score: 36,
        // Five periods, which is the only thing the quarters are still read for.
        linescores: [7, 10, 3, 10, 6],
      },
      away: {
        team: { name: "Kansas City Chiefs", abbreviation: "KC" },
        score: 30,
        linescores: [7, 3, 10, 10, 0],
      },
    });
    render(<GameStatusSummary game={game(overtime)} result={overtime} />);
    expect(screen.getByText("FT/OT")).toBeInTheDocument();
  });
});

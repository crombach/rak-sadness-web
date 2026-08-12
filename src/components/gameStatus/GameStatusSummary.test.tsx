import { fireEvent, render, screen, within } from "@testing-library/react";
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

function rowOf(abbreviation: string): Array<string | null> {
  return within(screen.getByRole("row", { name: new RegExp(abbreviation) }))
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
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

  it("heads the scoreline with the kickoff and the venue", () => {
    renderFinal();
    expect(
      screen.getByText("Highmark Stadium · Orchard Park, NY"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sun, Oct 6/)).toBeInTheDocument();
  });

  it("shows the quarters and the total for each side", () => {
    renderFinal();
    expect(rowOf("KC")).toEqual(["7", "3", "10", "0", "20"]);
    expect(rowOf("BUF")).toEqual(["7", "10", "3", "10", "30"]);
  });

  it("marks neither side, the ball being nobody's once the game is over", () => {
    renderFinal();
    expect(screen.queryByLabelText("Has the ball")).toBeNull();
  });

  it("stands the home side on the left, and heads the quarters with it", () => {
    renderFinal();
    expect(
      [...document.querySelectorAll(".game-status__side")].map(
        (side) => side.className,
      ),
    ).toEqual(["game-status__side --home", "game-status__side --away"]);
    expect(
      screen.getAllByRole("rowheader").map((cell) => cell.textContent),
    ).toEqual(["BUF", "KC"]);
  });

  it("wears both teams' marks, home first", () => {
    renderFinal();
    expect(logos()).toEqual([
      "https://espn.com/buf.png",
      "https://espn.com/kc.png",
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
    expect(screen.getByText("8:42 - 3rd Quarter")).toBeInTheDocument();
    expect(screen.getByText("2nd & 7")).toBeInTheDocument();
  });

  it("says who has the ball with the marker alone", () => {
    renderLive();
    expect(screen.getByLabelText("Has the ball")).toBeInTheDocument();
    expect(screen.queryByText("KC ball")).toBeNull();
  });

  it("carries a short form of the clock, for a phone", () => {
    renderLive();
    expect(screen.getByText("Q3 8:42")).toBeInTheDocument();
  });

  it("marks the side with the ball", () => {
    renderLive();
    expect(screen.getByLabelText("Has the ball")).toBeInTheDocument();
  });

  it("holds the quarter scores back until the game is over", () => {
    renderLive();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("GameStatusSummary, a game yet to kick off", () => {
  it("says when it starts, with nothing to say about how it is going", () => {
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
    expect(
      screen.getByText("Sun, October 6th - 1:00 PM EDT"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByLabelText("Has the ball")).toBeNull();
  });

  it("takes overtime as another column", () => {
    const overtime = result({
      detailMessage: "Final/OT",
      home: {
        team: { name: "Buffalo Bills", abbreviation: "BUF" },
        score: 36,
        linescores: [7, 10, 3, 10, 6],
      },
      away: {
        team: { name: "Kansas City Chiefs", abbreviation: "KC" },
        score: 30,
        linescores: [7, 3, 10, 10, 0],
      },
    });
    render(<GameStatusSummary game={game(overtime)} result={overtime} />);
    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent)
        .filter((text) => text !== "Team"),
    ).toEqual(["1", "2", "3", "4", "OT", "T"]);
  });
});

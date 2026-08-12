import { render, screen, within } from "@testing-library/react";
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
      team: { name: "Buffalo Bills", abbreviation: "BUF" },
      score: 30,
      record: "4-1",
      linescores: [7, 10, 3, 10],
    },
    away: {
      team: { name: "Kansas City Chiefs", abbreviation: "KC" },
      score: 20,
      record: "3-2",
      linescores: [7, 3, 10, 0],
    },
    venue: { name: "Highmark Stadium", city: "Orchard Park", state: "NY" },
    gamecastUrl: "https://espn.com/game",
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

describe("GameStatusSummary, before there is anything to show", () => {
  it("draws nothing with no game chosen", () => {
    const { container } = render(<GameStatusSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws nothing until the game has been fetched", () => {
    const { container } = render(<GameStatusSummary game={game(result())} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says so where ESPN listed no game for the column", () => {
    render(<GameStatusSummary game={game()} />);
    expect(screen.getByText(/No game was found for P1/)).toHaveTextContent(
      "KC / BUF",
    );
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

  it("marks the winner", () => {
    renderFinal();
    expect(screen.getByLabelText("Winner")).toBeInTheDocument();
    expect(screen.queryByLabelText("Has the ball")).toBeNull();
  });

  it("links out to the Gamecast", () => {
    renderFinal();
    expect(screen.getByRole("link", { name: "ESPN Gamecast" })).toHaveAttribute(
      "href",
      "https://espn.com/game",
    );
  });
});

describe("GameStatusSummary, a game still being played", () => {
  const live = result({
    status: GameStatus.LIVE,
    detailMessage: "8:42 - 3rd Quarter",
    possession: { homeAway: HomeAway.AWAY, downDistanceText: "2nd & 7" },
    winner: { team: null, homeAway: null, by: 10 },
    loser: { team: null, homeAway: null, by: 10 },
  });

  const renderLive = () =>
    render(<GameStatusSummary game={game(live)} result={live} />);

  it("shows the clock, the quarter, the ball, and the down", () => {
    renderLive();
    expect(screen.getByText("8:42 - 3rd Quarter")).toBeInTheDocument();
    expect(screen.getByText("KC ball")).toBeInTheDocument();
    expect(screen.getByText("2nd & 7")).toBeInTheDocument();
  });

  it("marks who has the ball rather than a winner", () => {
    renderLive();
    expect(screen.getByLabelText("Has the ball")).toBeInTheDocument();
    expect(screen.queryByLabelText("Winner")).toBeNull();
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

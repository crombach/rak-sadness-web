import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathsToVictory, VictoryRoute } from "../../types/PathsToVictory";
import VictorySummary from "./VictorySummary";

/** Routes of one game each, all different, so only their number matters. */
function routesOf(count: number): Array<VictoryRoute> {
  return Array.from({ length: count }, (_, index) => ({
    games: [{ label: `P${index + 1}`, pick: `T${index + 1} -3` }],
    mondayNight: { kind: "notNeeded" as const },
  }));
}

/** The picks under a heading, as the chips read on screen. */
function under(title: string): Array<string> {
  const heading = screen.getByRole("heading", { name: title });
  return within(heading.parentElement as HTMLElement)
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

const base = {
  kind: "paths" as const,
  player: "Alice",
  remainingGameCount: 4,
  pointsBehind: 2,
  leader: "Rak",
  mustWin: [],
  hiddenRouteCount: 0,
  needsHelp: [],
};

describe("VictorySummary", () => {
  it("asks for a player when it has no result yet", () => {
    render(<VictorySummary />);

    expect(screen.getByText("Pick a player")).toBeInTheDocument();
  });

  it("gives an eliminated player the reason they carry", () => {
    const result: PathsToVictory = {
      kind: "eliminated",
      player: "Bob",
      explanation: "Knocked out on Total Score by Alice.",
    };
    render(<VictorySummary result={result} />);

    expect(screen.getByText("Bob cannot win this week.")).toBeInTheDocument();
    expect(
      screen.getByText("Knocked out on Total Score by Alice."),
    ).toBeInTheDocument();
  });

  it("says a clinched week is already won", () => {
    render(<VictorySummary result={{ kind: "clinched", player: "Alice" }} />);

    expect(
      screen.getByText("Alice has already won the week."),
    ).toBeInTheDocument();
  });

  it("gives a floor rather than routes on a week too big to search", () => {
    const result: PathsToVictory = {
      kind: "headline",
      player: "Alice",
      remainingGameCount: 14,
      remainingPickCount: 13,
      minimumWins: 6,
      needsMondayNight: true,
    };
    render(<VictorySummary result={result} />);

    expect(
      screen.getByText("Alice needs at least 6 of their 13 remaining picks."),
    ).toBeInTheDocument();
    expect(screen.getByText(/MNF points tiebreaker/)).toBeInTheDocument();
    expect(screen.getByText("14 games still to play")).toBeInTheDocument();
  });

  it("shows how far back the player is and what is left to play", () => {
    render(<VictorySummary result={{ ...base, mustWin: [] }} />);

    expect(
      screen.getByText("2 points behind Rak · 4 games still to play"),
    ).toBeInTheDocument();
  });

  it("lists the must-win games and the pool behind them", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "C4", pick: "UGA -7" }],
      pool: {
        choose: 2,
        games: [
          { label: "P2", pick: "KC -3" },
          { label: "P9", pick: "BUF +1" },
          { label: "P11", pick: "SF -6" },
        ],
      },
      mondayNight: { kind: "notNeeded" },
    };
    render(<VictorySummary result={result} />);

    expect(under("Must win")).toEqual(["C4UGA -7"]);
    expect(under("Then any 2 of these")).toEqual([
      "P2KC -3",
      "P9BUF +1",
      "P11SF -6",
    ]);
  });

  it("writes a bounded Monday night range as a sentence", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: {
        kind: "range",
        min: 38,
        max: 44,
        contenders: ["Rak", "Bill"],
      },
    };
    render(<VictorySummary result={result} />);

    expect(
      screen.getByText("38 ≤ MNF points ≤ 44 to beat Rak and Bill."),
    ).toBeInTheDocument();
  });

  it("writes an open-ended range from the end it is bounded on", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: { kind: "range", max: 45, contenders: ["Rak"] },
    };
    render(<VictorySummary result={result} />);

    expect(
      screen.getByText("MNF points ≤ 45 to beat Rak."),
    ).toBeInTheDocument();
  });

  it("says what it takes to win without the tiebreaker at all", () => {
    const result: PathsToVictory = {
      ...base,
      pool: { choose: 2, games: [{ label: "P1", pick: "KC -3" }] },
      outrightAt: 3,
      mondayNight: { kind: "range", max: 45, contenders: ["Rak"] },
    };
    render(<VictorySummary result={result} />);

    expect(
      screen.getByText("Winning 3 games instead takes it outright."),
    ).toBeInTheDocument();
  });

  it("leaves the outright line off where it asks no more than the routes do", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      outrightAt: 1,
      mondayNight: { kind: "notNeeded" },
    };
    render(<VictorySummary result={result} />);

    expect(screen.queryByText(/takes it outright/)).not.toBeInTheDocument();
  });

  it("names the team that has to miss in a game the player left blank", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      needsHelp: [{ label: "P7", needsToMiss: ["DEN"] }],
      mondayNight: { kind: "notNeeded" },
    };
    render(<VictorySummary result={result} />);

    expect(
      screen.getByText(/is blank on your sheet, so DEN has to miss/),
    ).toBeInTheDocument();
  });

  it("lists routes of different shapes with the ones that need a total marked", () => {
    const result: PathsToVictory = {
      ...base,
      routes: [
        {
          games: [{ label: "P1", pick: "KC -3" }],
          mondayNight: { kind: "notNeeded" },
        },
        {
          games: [
            { label: "P2", pick: "BUF -1" },
            { label: "P3", pick: "SF -6" },
          ],
          mondayNight: { kind: "range", max: 32, contenders: ["Rak"] },
        },
      ],
      hiddenRouteCount: 2,
    };
    render(<VictorySummary result={result} />);

    // Read off the routes themselves, since each one holds a list of picks of
    // its own and reading every list item at once would flatten the two apart.
    const routes = [...document.querySelectorAll(".victory__route")];
    expect(routes.map((route) => route.textContent)).toEqual([
      "P1KC -3",
      "P2BUF -1P3SF -6MNF points ≤ 32 to beat Rak.",
    ]);
    expect(screen.getByText("2 other routes not shown.")).toBeInTheDocument();
  });

  it("holds five routes open and folds the rest behind a button", () => {
    const result: PathsToVictory = { ...base, routes: routesOf(8) };
    render(<VictorySummary result={result} />);

    expect(document.querySelectorAll(".victory__route")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Show 3 more routes" }),
    ).toBeInTheDocument();
  });

  it("shows the rest once the button is clicked", async () => {
    const result: PathsToVictory = { ...base, routes: routesOf(8) };
    render(<VictorySummary result={result} />);
    await userEvent.click(screen.getByRole("button"));

    expect(document.querySelectorAll(".victory__route")).toHaveLength(8);
    expect(
      screen.getByRole("button", { name: "Show fewer" }),
    ).toBeInTheDocument();
  });

  it("leaves the button off where every route is already open", () => {
    const result: PathsToVictory = { ...base, routes: routesOf(5) };
    render(<VictorySummary result={result} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

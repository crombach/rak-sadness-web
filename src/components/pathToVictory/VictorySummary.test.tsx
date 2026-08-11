import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathsToVictory, VictoryRoute } from "../../types/PathsToVictory";
import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";
import VictorySummary, { Standing } from "./VictorySummary";

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

describe("Standing", () => {
  function player(name: string, total: number, pick: string): PlayerScore {
    return {
      name,
      score: { total, college: 0, pro: total, proAgainstTheSpread: 0 },
      tiebreaker: {},
      college: [],
      pro: [
        {
          pick,
          status: "incomplete",
          explanation: { header: "", message: "" },
        },
      ],
      status: { hasNoPicks: false, isKnockedOut: false },
    };
  }

  const scores: RakMadnessScores = {
    scores: [player("Rak", 3, "KC -3"), player("Alice", 1, "DEN +3")],
  };

  it("names the leader and their score before anyone is picked", () => {
    render(<Standing scores={scores} />);

    expect(
      screen.getByText("Rak leads with 3 points · 1 game still to play"),
    ).toBeInTheDocument();
  });

  it("counts the leaders where the top is shared", () => {
    const tied: RakMadnessScores = {
      scores: [...scores.scores, player("Bill", 3, "KC -3")],
    };
    render(<Standing scores={tied} />);

    expect(
      screen.getByText("2 players lead with 3 points · 1 game still to play"),
    ).toBeInTheDocument();
  });

  it("counts the player picked back to the leader", () => {
    render(<Standing scores={scores} player="Alice" />);

    expect(
      screen.getByText("2 points behind Rak · 1 game still to play"),
    ).toBeInTheDocument();
  });

  it("ties the player picked to the lead where they hold it", () => {
    render(<Standing scores={scores} player="Rak" />);

    expect(
      screen.getByText("Tied for the lead · 1 game still to play"),
    ).toBeInTheDocument();
  });

  it("has nothing to say before a week is scored", () => {
    const { container } = render(<Standing />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("VictorySummary", () => {
  it("says nothing until a player is picked", () => {
    const { container } = render(<VictorySummary />);

    expect(container).toBeEmptyDOMElement();
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
      screen.getByText("Winning 3 games takes it outright. Otherwise:"),
    ).toBeInTheDocument();
  });

  it("leads with taking the week outright, ahead of the games", () => {
    const result: PathsToVictory = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: { kind: "notNeeded" },
    };
    render(<VictorySummary result={result} />);

    const outright = screen.getByText(/Takes the week outright/);
    const mustWin = screen.getByRole("heading", { name: "Must win" });
    expect(
      outright.compareDocumentPosition(mustWin) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
    const note = screen.getByText("2 other routes found but not shown.");
    expect(note).toBe(document.querySelector(".victory")?.lastElementChild);
  });

  it("holds four routes open and folds the rest behind a button", () => {
    const result: PathsToVictory = { ...base, routes: routesOf(8) };
    render(<VictorySummary result={result} />);

    expect(document.querySelectorAll(".victory__route")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: "Show 4 more routes" }),
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
    const result: PathsToVictory = { ...base, routes: routesOf(4) };
    render(<VictorySummary result={result} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerAnalysis, VictoryRoute } from "../../types/PlayerAnalysis";
import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";
import AnalysisSummary, { Standing } from "./AnalysisSummary";

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

/** The one tiebreaker range the cases below need: beat Rak on 45 points. */
const RAK_BY_45 = {
  kind: "range" as const,
  max: 45,
  contenders: ["Rak"],
};

const base = {
  kind: "paths" as const,
  player: "Alice",
  mustWin: [],
  hiddenRouteCount: 0,
  needsHelp: [],
};

describe("Standing", () => {
  /** Whole standing, whose headline is drawn apart from the tail it sits before. */
  function standingText(): string {
    return document.querySelector(".analysis__standing")?.textContent ?? "";
  }

  /** One game already settled and one still open, which is a week under way. */
  function player(name: string, total: number, pick: string): PlayerScore {
    const result = (status: PlayerScore["pro"][number]["status"]) => ({
      pick,
      status,
      explanation: { header: "", message: "" },
    });
    return {
      name,
      score: { total, college: 0, pro: total, proAgainstTheSpread: 0 },
      tiebreaker: {},
      college: [],
      pro: [result("yes"), result("incomplete")],
      status: { hasNoPicks: false, isKnockedOut: false },
    };
  }

  const scores: RakMadnessScores = {
    scores: [player("Rak", 3, "KC -3"), player("Alice", 1, "DEN +3")],
  };

  it("says nothing until the scores hold the player picked", () => {
    // A name the week does not hold, then a name with no week behind it yet.
    const { container: withoutPlayer } = render(
      <Standing scores={scores} player="Nobody" />,
    );
    expect(withoutPlayer).toBeEmptyDOMElement();

    const { container: withoutScores } = render(<Standing player="Rak" />);
    expect(withoutScores).toBeEmptyDOMElement();
  });

  it("counts the player picked back to the leader", () => {
    render(<Standing scores={scores} player="Alice" />);

    expect(standingText()).toBe("2 points behind Rak · 1 game still to play");
  });

  it("ties the player picked to the lead where they hold it", () => {
    render(<Standing scores={scores} player="Rak" />);

    expect(standingText()).toBe("Tied for the lead · 1 game still to play");
  });

  /** The same week with nothing left open, which is a week that has a winner. */
  function finished(week: RakMadnessScores): RakMadnessScores {
    return {
      scores: week.scores.map((it) => ({
        ...it,
        pro: it.pro.map((pick) => ({ ...pick, status: "yes" as const })),
      })),
    };
  }

  it("calls the player picked the winner rather than tied for the lead", () => {
    render(<Standing scores={finished(scores)} player="Rak" />);

    expect(standingText()).toBe("Winner · Week complete");
  });

  it("ties the player picked for the win where the top is shared", () => {
    const tied: RakMadnessScores = {
      scores: [...scores.scores, player("Bill", 3, "KC -3")],
    };
    render(<Standing scores={finished(tied)} player="Rak" />);

    expect(standingText()).toBe("Tied for the win · Week complete");
  });

  /** Level on points, told apart by the Monday night tiebreaker. */
  function separated(week: RakMadnessScores): RakMadnessScores {
    return {
      scores: week.scores.map((it, index) => ({
        ...it,
        tiebreaker: { pick: 40, distance: index },
      })),
    };
  }

  const separatedWeek = separated(
    finished({
      scores: [player("Rak", 3, "KC -3"), player("Bill", 3, "KC -3")],
    }),
  );

  it("calls the player picked the winner where they took the tiebreaker", () => {
    render(<Standing scores={separatedWeek} player="Rak" />);

    // Level on points with Bill, so only the tiebreaker makes this one winner.
    expect(standingText()).toBe("Winner · Week complete");
  });

  it("says the player picked lost the tiebreaker rather than tied for the win", () => {
    render(<Standing scores={separatedWeek} player="Bill" />);

    expect(standingText()).toBe("Loses the tiebreaker to Rak · Week complete");
  });

  it("calls a clinched player the winner even where games remain", () => {
    render(
      <Standing
        scores={scores}
        player="Rak"
        result={{ kind: "clinched", player: "Rak" }}
      />,
    );

    expect(standingText()).toBe("Winner · 1 game still to play");
  });

  it("ties a clinched player for the win where the top is shared", () => {
    const tied: RakMadnessScores = {
      scores: [...scores.scores, player("Bill", 3, "KC -3")],
    };
    render(
      <Standing
        scores={tied}
        player="Rak"
        result={{ kind: "clinched", player: "Rak" }}
      />,
    );

    expect(standingText()).toBe("Tied for the win · 1 game still to play");
  });

  it("ignores a clinch that answers for a different player", () => {
    render(
      <Standing
        scores={scores}
        player="Rak"
        result={{ kind: "clinched", player: "Alice" }}
      />,
    );

    expect(standingText()).toBe("Tied for the lead · 1 game still to play");
  });

  /** The same week with one player out of it. */
  function knockedOut(week: RakMadnessScores, name: string): RakMadnessScores {
    return {
      scores: week.scores.map((it) =>
        it.name === name
          ? { ...it, status: { ...it.status, isKnockedOut: true } }
          : it,
      ),
    };
  }

  it("says a knocked out player is knocked out, and leaves the points to the answer", () => {
    render(<Standing scores={knockedOut(scores, "Alice")} player="Alice" />);

    expect(standingText()).toBe("Knocked out · 1 game still to play");
  });

  it("colors a win and a knockout, and leaves an open standing plain", () => {
    const headlineClasses = () =>
      document.querySelector(".analysis__standing")?.firstElementChild
        ?.className ?? "";

    const { unmount: unmountWinner } = render(
      <Standing scores={finished(scores)} player="Rak" />,
    );
    expect(headlineClasses()).toContain("--won");
    unmountWinner();

    const { unmount: unmountKnockedOut } = render(
      <Standing scores={knockedOut(scores, "Alice")} player="Alice" />,
    );
    expect(headlineClasses()).toContain("--knocked-out");
    unmountKnockedOut();

    render(<Standing scores={scores} player="Alice" />);
    expect(headlineClasses()).toBe("");
  });

  /** One game nobody could be scored on, which is a hole in a week otherwise done. */
  function withUnscoreableGame(week: RakMadnessScores): RakMadnessScores {
    return {
      scores: week.scores.map((it) => ({
        ...it,
        pro: [
          {
            ...it.pro[0],
            status: "error" as const,
            explanation: { header: "Invalid Spread", message: "" },
          },
          ...it.pro.slice(1),
        ],
      })),
    };
  }

  it("does not call a week complete while a game cannot be scored", () => {
    render(
      <Standing scores={withUnscoreableGame(finished(scores))} player="Rak" />,
    );

    // Not the winner: a week with a hole in it has no result to state yet.
    expect(standingText()).toBe(
      "Tied for the lead · 1 game could not be scored",
    );
  });

  it("counts a blank cell as the player's own, not a hole in the week", () => {
    const blank: RakMadnessScores = {
      scores: finished(scores).scores.map((it, index) => ({
        ...it,
        pro:
          index === 0
            ? it.pro
            : [
                {
                  ...it.pro[0],
                  status: "error" as const,
                  explanation: { header: "Missing Pick", message: "" },
                },
                ...it.pro.slice(1),
              ],
      })),
    };
    render(<Standing scores={blank} player="Rak" />);

    expect(standingText()).toBe("Winner · Week complete");
  });

  it("says no game has been played rather than ranking anyone", () => {
    const fresh: RakMadnessScores = {
      scores: scores.scores.map((it) => ({
        ...it,
        score: { total: 0, college: 0, pro: 0, proAgainstTheSpread: 0 },
        pro: it.pro.map((pick) => ({ ...pick, status: "incomplete" as const })),
      })),
    };
    render(<Standing scores={fresh} player="Rak" />);

    expect(standingText()).toBe("No finished games · 2 games still to play");
  });
});

describe("AnalysisSummary", () => {
  it("says nothing until a player is picked", () => {
    const { container } = render(<AnalysisSummary />);

    expect(container).toBeEmptyDOMElement();
  });

  it("gives an eliminated player the reason they carry", () => {
    const result: PlayerAnalysis = {
      kind: "eliminated",
      player: "Bob",
      explanation: "Knocked out on Total Score by Alice.",
    };
    render(<AnalysisSummary result={result} />);

    // The reason says they cannot win, so nothing above it says so again.
    expect(
      screen.getByText("Knocked out on Total Score by Alice."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bob cannot win this week.")).toBeNull();
  });

  it("tells an eliminated player carrying no reason that they cannot win", () => {
    const result: PlayerAnalysis = { kind: "eliminated", player: "Bob" };
    render(<AnalysisSummary result={result} />);

    expect(screen.getByText("Bob cannot win this week.")).toBeInTheDocument();
  });

  it("says nothing left can undo a clinch with games still to play", () => {
    render(
      <AnalysisSummary
        result={{ kind: "clinched", player: "Alice" }}
        week={12}
      />,
    );

    // The header calls Alice the winner without naming the week, so this does.
    expect(screen.getByText("Alice has won week 12.")).toBeInTheDocument();
    expect(
      screen.getByText("Nothing still to be played can take it away."),
    ).toBeInTheDocument();
  });

  it("leaves a clinch that also ends the week to its one line", () => {
    render(
      <AnalysisSummary
        result={{ kind: "clinched", player: "Alice" }}
        week={12}
        isOver
      />,
    );

    expect(screen.getByText("Alice has won week 12.")).toBeInTheDocument();
    // Nothing is still to be played, so saying it cannot be undone adds nothing.
    expect(
      screen.queryByText(/Nothing still to be played/),
    ).not.toBeInTheDocument();
  });

  it("gives a floor rather than paths on a week too big to search", () => {
    const result: PlayerAnalysis = {
      kind: "headline",
      player: "Alice",
      remainingPickCount: 13,
      minimumWins: 6,
      needsMondayNight: true,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("Alice needs at least 6 of their 13 remaining picks."),
    ).toBeInTheDocument();
    expect(screen.getByText(/MNF Points tiebreaker/)).toBeInTheDocument();
    const why = screen.getByText(
      "Detailed paths are worked out once ten games are left.",
    );
    expect(why).toBe(
      document.querySelector(".analysis__body")?.lastElementChild,
    );
  });

  it("lists the must-win games and the pool behind them", () => {
    const result: PlayerAnalysis = {
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
    render(<AnalysisSummary result={result} />);

    expect(under("Must win")).toEqual(["C4UGA -7"]);
    expect(under("Then any 2 of these")).toEqual([
      "P2KC -3",
      "P9BUF +1",
      "P11SF -6",
    ]);
  });

  it("says something for a player the games can no longer separate", () => {
    const result: PlayerAnalysis = {
      ...base,
      mondayNight: RAK_BY_45,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText(
        "No clean path to victory. The MNF Points tiebreaker decides it.",
      ),
    ).toBeInTheDocument();
  });

  it("writes a bounded Monday night range as a sentence", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: {
        kind: "range",
        min: 38,
        max: 44,
        contenders: ["Rak", "Bill"],
      },
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("38 ≤ MNF Points ≤ 44 to beat Rak and Bill."),
    ).toBeInTheDocument();
  });

  it("writes an open-ended range from the end it is bounded on", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: RAK_BY_45,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("MNF Points ≤ 45 to beat Rak."),
    ).toBeInTheDocument();
  });

  it("says what it takes to win without the tiebreaker at all", () => {
    const result: PlayerAnalysis = {
      ...base,
      pool: { choose: 2, games: [{ label: "P1", pick: "KC -3" }] },
      outrightAt: 3,
      mondayNight: RAK_BY_45,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("Winning 3 games takes it outright. Otherwise:"),
    ).toBeInTheDocument();
  });

  it("leads with taking the week outright, ahead of the games", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: { kind: "notNeeded" },
    };
    render(<AnalysisSummary result={result} />);

    const outright = screen.getByText(/Takes the week outright/);
    const mustWin = screen.getByRole("heading", { name: "Must win" });
    expect(
      outright.compareDocumentPosition(mustWin) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("leaves the outright line off where it asks no more than the routes do", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      outrightAt: 1,
      mondayNight: { kind: "notNeeded" },
    };
    render(<AnalysisSummary result={result} />);

    expect(screen.queryByText(/takes it outright/)).not.toBeInTheDocument();
  });

  it("names the player standing where nothing takes the week outright", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      mondayNight: RAK_BY_45,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("Alice is still live to win the week. What it takes:"),
    ).toBeInTheDocument();
  });

  it("names the team that has to miss in a game the player left blank", () => {
    const result: PlayerAnalysis = {
      ...base,
      mustWin: [{ label: "P1", pick: "KC -3" }],
      needsHelp: [{ label: "P7", needsToMiss: ["DEN"] }],
      mondayNight: { kind: "notNeeded" },
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText(/is blank on your sheet, so DEN has to miss/),
    ).toBeInTheDocument();
  });

  it("lists routes of different shapes with the ones that need a total marked", () => {
    const result: PlayerAnalysis = {
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
    };
    render(<AnalysisSummary result={result} />);

    // Read off the routes themselves, since each one holds a list of picks of
    // its own and reading every list item at once would flatten the two apart.
    const routes = [...document.querySelectorAll(".analysis__route")];
    expect(routes.map((route) => route.textContent)).toEqual([
      "P1KC -3",
      "P2BUF -1P3SF -6ANDMNF Points ≤ 32TO BEAT Rak",
    ]);
  });

  it("counts the routes left off under the last one, once they are all open", async () => {
    const result: PlayerAnalysis = {
      ...base,
      routes: routesOf(8),
      hiddenRouteCount: 2,
    };
    render(<AnalysisSummary result={result} />);

    const note = "2 other paths found but not shown.";
    expect(screen.queryByText(note)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button"));

    const routes = [...document.querySelectorAll(".analysis__route")];
    expect(screen.getByText(note).previousElementSibling).toBe(
      routes[routes.length - 1]?.parentElement,
    );
  });

  it("counts them straight away where no route was folded away", () => {
    const result: PlayerAnalysis = {
      ...base,
      routes: routesOf(2),
      hiddenRouteCount: 2,
    };
    render(<AnalysisSummary result={result} />);

    expect(
      screen.getByText("2 other paths found but not shown."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("names every player a route's total has to beat", () => {
    const result: PlayerAnalysis = {
      ...base,
      routes: [
        {
          games: [{ label: "P1", pick: "KC -3" }],
          mondayNight: { kind: "range", min: 30, contenders: ["Rak", "Bill"] },
        },
      ],
    };
    render(<AnalysisSummary result={result} />);

    expect(document.querySelector(".analysis__route")?.textContent).toBe(
      "P1KC -3ANDMNF Points ≥ 30TO BEAT Rak, Bill",
    );
  });

  it("states a total every route shares once, not on each of them", () => {
    const shared = { kind: "range" as const, max: 32, contenders: ["Rak"] };
    const result: PlayerAnalysis = {
      ...base,
      routes: [
        { games: [{ label: "P1", pick: "KC -3" }], mondayNight: shared },
        { games: [{ label: "P2", pick: "BUF -1" }], mondayNight: shared },
      ],
      mondayNight: shared,
    };
    render(<AnalysisSummary result={result} />);

    const routes = [...document.querySelectorAll(".analysis__route")];
    expect(routes.map((route) => route.textContent)).toEqual([
      "P1KC -3",
      "P2BUF -1",
    ]);
    expect(
      screen.getByText("MNF Points ≤ 32 to beat Rak."),
    ).toBeInTheDocument();
  });

  it("holds four routes open and folds the rest behind a button", () => {
    const result: PlayerAnalysis = { ...base, routes: routesOf(8) };
    render(<AnalysisSummary result={result} />);

    expect(document.querySelectorAll(".analysis__route")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: "Show 4 more paths" }),
    ).toBeInTheDocument();
  });

  it("shows the rest once the button is clicked", async () => {
    const result: PlayerAnalysis = { ...base, routes: routesOf(8) };
    render(<AnalysisSummary result={result} />);
    await userEvent.click(screen.getByRole("button"));

    expect(document.querySelectorAll(".analysis__route")).toHaveLength(8);
    expect(
      screen.getByRole("button", { name: "Show fewer" }),
    ).toBeInTheDocument();
  });

  it("leaves the button off where every route is already open", () => {
    const result: PlayerAnalysis = { ...base, routes: routesOf(4) };
    render(<AnalysisSummary result={result} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

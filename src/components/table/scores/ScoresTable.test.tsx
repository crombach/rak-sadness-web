import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { PlayerScore, RakMadnessScores } from "../../../types/RakMadnessScores";
import { PlayerAnalysisContextProvider } from "../../../context/PlayerAnalysisContext";
import ScoresTable from "./ScoresTable";

const showPlayerAnalysis = vi.fn();

function player(overrides: Partial<PlayerScore> = {}): PlayerScore {
  return {
    name: "Alice",
    score: { total: 3, college: 1, pro: 2, proAgainstTheSpread: 1 },
    tiebreaker: { pick: 41, distance: 0 },
    college: [],
    pro: [],
    status: { hasNoPicks: false, isKnockedOut: false, explanation: "Winner!" },
    ...overrides,
  };
}

const knockedOutBob = player({
  name: "Bob",
  score: { total: 1, college: 0, pro: 1, proAgainstTheSpread: 0 },
  tiebreaker: { pick: 45, distance: 4 },
  status: {
    hasNoPicks: false,
    isKnockedOut: true,
    explanation: "Knocked out on Total Score by Alice.",
  },
});

function mountTable(scores?: RakMadnessScores) {
  return render(
    <PlayerAnalysisContextProvider showPlayerAnalysis={showPlayerAnalysis}>
      <ScoresTable scores={scores} />
    </PlayerAnalysisContextProvider>,
  );
}

const bothPlayers: RakMadnessScores = {
  tiebreaker: 41,
  scores: [player(), knockedOutBob],
};

describe("ScoresTable", () => {
  it("renders nothing without scores", () => {
    mountTable(undefined);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders the score columns", () => {
    mountTable(bothPlayers);
    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual([
      "Rank",
      "Player",
      "MNF Points Pick",
      "MNF Points Distance",
      "College Score",
      "Pro Score",
      "Pro Score ATS",
      "Total Score",
    ]);
  });

  it("renders one row per player, in the order given", () => {
    mountTable(bothPlayers);
    const names = screen
      .getAllByRole("button")
      .map((cell) => cell.textContent?.trim());
    expect(names).toEqual(["Alice", "Bob"]);
  });

  it("renders each player's rank and scores", () => {
    mountTable(bothPlayers);
    const cells = screen.getAllByRole("row")[1].querySelectorAll("td, th");
    expect(Array.from(cells).map((cell) => cell.textContent?.trim())).toEqual([
      "1",
      "Alice",
      "41",
      "0",
      "1",
      "2",
      "1",
      "3",
    ]);
  });

  it("shows N/A when a player has no tiebreaker pick", () => {
    mountTable({
      tiebreaker: 41,
      scores: [
        player({
          tiebreaker: {
            pick: undefined as unknown as number,
            distance: undefined as unknown as number,
          },
        }),
      ],
    });
    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });

  it("marks a knocked-out player's name cell", () => {
    mountTable(bothPlayers);
    const [alice, bob] = screen.getAllByRole("button");
    expect(alice.className).not.toContain("--knocked-out");
    expect(bob.className).toContain("--knocked-out");
  });

  it("opens the player analysis when a name is clicked", async () => {
    mountTable(bothPlayers);
    await userEvent.click(screen.getByRole("button", { name: /Bob/ }));
    expect(showPlayerAnalysis).toHaveBeenCalledWith("Bob");
  });
});

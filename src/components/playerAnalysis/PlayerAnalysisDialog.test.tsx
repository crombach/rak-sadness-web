import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
} from "../../types/RakMadnessScores";
import PlayerAnalysisDialog, {
  playerOptions,
  playersMatching,
} from "./PlayerAnalysisDialog";

function proPick(pick: string): PickResult {
  return {
    pick,
    status: "incomplete",
    explanation: { header: "", message: "" },
  };
}

function player(
  name: string,
  total: number,
  pick: string,
  explanation?: string,
): PlayerScore {
  return {
    name,
    score: { total, college: 0, pro: total, proAgainstTheSpread: 0 },
    tiebreaker: {},
    college: [],
    pro: [proPick(pick)],
    status: {
      hasNoPicks: false,
      isKnockedOut: explanation != null,
      explanation,
    },
  };
}

/**
 * Two players level on points with one game left, which they picked opposite
 * ways, and a third already out of it.
 */
const scores: RakMadnessScores = {
  scores: [
    player("Alice", 3, "KC -3"),
    player("Bob", 3, "DEN +3"),
    player("Bobby", 0, "DEN +3", "Knocked out on Total Score by Alice."),
  ],
};

describe("playersMatching", () => {
  const options = playerOptions(scores);

  it("offers a knocked out player alongside anyone standing", () => {
    expect(playersMatching(options, "Bob")).toEqual([
      { name: "Bob", isKnockedOut: false },
      { name: "Bobby", isKnockedOut: true },
    ]);
  });

  it("offers the knocked out player where they are the only match", () => {
    expect(playersMatching(options, "Bobby")).toEqual([
      { name: "Bobby", isKnockedOut: true },
    ]);
  });

  it("offers everyone before anything is typed, in the order ranked", () => {
    expect(playersMatching(options, "").map((it) => it.name)).toEqual([
      "Alice",
      "Bob",
      "Bobby",
    ]);
  });

  it("has nobody to offer before a week is scored", () => {
    expect(playersMatching(playerOptions(undefined), "")).toEqual([]);
  });
});

/*
 * One mounted dialog for the whole file, on purpose.
 *
 * Base UI hangs its scroll lock, focus guards, and inert markers off the document
 * while a dialog is open, and mounting a second one leaves the previous set behind.
 * Every other case in a file that mounts several then types into an input those
 * leftovers have put out of reach. The app never does this: `ResultsFrame` holds
 * one dialog and toggles `open` on it.
 *
 * So this covers the wiring once, and what each result reads like is covered
 * against `AnalysisSummary` instead.
 */
describe("PlayerAnalysisDialog", () => {
  it("answers for the player picked from the search, and for one named", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlayerAnalysisDialog
        open
        onOpenChange={() => undefined}
        scores={scores}
      />,
    );

    const search = screen.getByRole("combobox", { name: "Player" });
    await user.type(search, "zzz");
    expect(await screen.findByText("No matching players")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "Ali");
    await user.click(await screen.findByRole("option", { name: "Alice" }));

    // Announced as busy while the search runs, on the region a screen reader
    // reads politely once the answer replaces it.
    expect(
      screen.getByRole("progressbar", { name: "Working out the paths" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(document.querySelector(".player-analysis__content")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    // The search runs a frame after the bar that says it is under way.
    const mustWin = await screen.findByRole("heading", { name: "Must win" });
    const pick = within(mustWin.parentElement as HTMLElement).getByRole(
      "listitem",
    );
    expect(pick).toHaveTextContent("P1");
    expect(pick).toHaveTextContent("KC -3");

    // A name from outside stands in for the same choice, knocked out or not.
    rerender(
      <PlayerAnalysisDialog
        open
        onOpenChange={() => undefined}
        player="Bobby"
        scores={scores}
      />,
    );

    expect(
      await screen.findByText("Knocked out on Total Score by Alice."),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Player" })).toHaveValue(
      "Bobby",
    );
  });
});

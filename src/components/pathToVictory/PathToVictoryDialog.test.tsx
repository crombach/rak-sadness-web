import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
} from "../../types/RakMadnessScores";
import PathToVictoryDialog, {
  playerOptions,
  playersMatching,
} from "./PathToVictoryDialog";

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
  isKnockedOut = false,
): PlayerScore {
  return {
    name,
    score: { total, college: 0, pro: total, proAgainstTheSpread: 0 },
    tiebreaker: {},
    college: [],
    pro: [proPick(pick)],
    status: { hasNoPicks: false, isKnockedOut },
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
    player("Bobby", 0, "DEN +3", true),
  ],
};

describe("playersMatching", () => {
  const options = playerOptions(scores);

  it("holds a knocked out player back while anyone standing matches", () => {
    expect(playersMatching(options, "Bob")).toEqual([
      { name: "Bob", isKnockedOut: false },
    ]);
  });

  it("offers the knocked out player where they are the only match", () => {
    expect(playersMatching(options, "Bobby")).toEqual([
      { name: "Bobby", isKnockedOut: true },
    ]);
  });

  it("offers everyone still standing before anything is typed", () => {
    expect(playersMatching(options, "").map((it) => it.name)).toEqual([
      "Alice",
      "Bob",
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
 * against `VictorySummary` instead.
 */
describe("PathToVictoryDialog", () => {
  it("works out the route of the player picked from the search", async () => {
    const user = userEvent.setup();
    render(
      <PathToVictoryDialog
        open
        onOpenChange={() => undefined}
        scores={scores}
      />,
    );

    expect(screen.getByText("Pick a player")).toBeInTheDocument();

    await user.type(screen.getByRole("combobox", { name: "Player" }), "Ali");
    await user.click(await screen.findByRole("option", { name: "Alice" }));

    const mustWin = screen.getByRole("heading", { name: "Must win" });
    const pick = within(mustWin.parentElement as HTMLElement).getByRole(
      "listitem",
    );
    expect(pick).toHaveTextContent("P1");
    expect(pick).toHaveTextContent("KC -3");
  });
});

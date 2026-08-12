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
    expect(
      document.querySelector(".player-analysis__body [aria-live]"),
    ).toHaveAttribute("aria-live", "polite");

    // The search runs a frame after the bar that says it is under way.
    const mustWin = await screen.findByRole("heading", { name: "Must win" });
    // The bar goes with the answer arriving, rather than sitting over it.
    expect(screen.queryByRole("progressbar")).toBeNull();
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

    // Closing takes that name away again. Nothing here goes with it, since the
    // answer and the search are still on screen for as long as the fade runs.
    rerender(
      <PlayerAnalysisDialog
        open
        onOpenChange={() => undefined}
        scores={scores}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Player" })).toHaveValue(
      "Bobby",
    );
    expect(
      screen.getByText("Knocked out on Total Score by Alice."),
    ).toBeInTheDocument();

    // Opened on that same player twice running, with something half typed into the
    // search in between. The name arriving is still a change, so it wins.
    await user.clear(screen.getByRole("combobox", { name: "Player" }));
    await user.type(screen.getByRole("combobox", { name: "Player" }), "Ali");
    rerender(
      <PlayerAnalysisDialog
        open
        onOpenChange={() => undefined}
        player="Bobby"
        scores={scores}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Player" })).toHaveValue(
      "Bobby",
    );

    // Typing above left the list open, which in the app it never is when a name
    // arrives: the dialog is modal, so the table that names one is out of reach
    // until it closes and takes the search with it.
    await user.keyboard("{Escape}");

    // Tapping the search is the start of looking someone else up, so the name in
    // it goes and everyone is offered again. The answer stays on the player it was
    // opened on until another one is picked.
    await user.click(screen.getByRole("combobox", { name: "Player" }));

    expect(screen.getByRole("combobox", { name: "Player" })).toHaveValue("");
    expect(
      (await screen.findAllByRole("option")).map((it) => it.textContent),
    ).toEqual(["Alice", "Bob", "Bobby"]);
    expect(
      screen.getByText("Knocked out on Total Score by Alice."),
    ).toBeInTheDocument();
  });
});

import { screen, waitFor } from "@testing-library/react";

vi.mock("./utils/getLeagueInfo");
vi.mock("./utils/readFileToBuffer");
vi.mock("./utils/scoring/getPlayerScores");
vi.mock("./utils/buildSpreadsheetBuffer");

import {
  CURRENT_WEEK,
  scores,
  openWeekScores,
  getPlayerScoresMock,
  buildSpreadsheetBufferMock,
  mountLoadedApp,
  uploadSpreadsheet,
  scoresHeaderButtons,
  setUpAppTest,
} from "./appTestFixtures";

beforeEach(() => {
  setUpAppTest();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the app, results views", () => {
  async function mountWithScores() {
    const user = await mountLoadedApp();
    await uploadSpreadsheet(user);
    await waitFor(() => {
      expect(screen.getByText("View Results")).toBeEnabled();
    });
    return user;
  }

  it("opens the scoreboard view", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    expect(screen.getByText("MNF Points Pick")).toBeInTheDocument();
    expect(screen.queryByText("Use Local Spreadsheet")).not.toBeInTheDocument();
  });

  it("switches to the picks view and back", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    const [scoreboard, picks] = scoresHeaderButtons();
    await user.click(picks);
    expect(screen.getByText("College Score")).toBeInTheDocument();
    expect(screen.queryByText("MNF Points Pick")).not.toBeInTheDocument();

    await user.click(scoreboard);
    expect(screen.getByText("MNF Points Pick")).toBeInTheDocument();
  });

  it("labels the two view buttons", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    const [scoreboard, picks] = scoresHeaderButtons();
    expect(scoreboard).toHaveTextContent("Scoreboard");
    expect(picks).toHaveTextContent("Picks");
  });

  it("marks the view you are on, on both routes", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    const [scoreboard, picks] = scoresHeaderButtons();
    expect(scoreboard).toHaveAttribute("aria-pressed", "true");
    expect(picks).toHaveAttribute("aria-pressed", "false");

    await user.click(picks);
    expect(picks).toHaveAttribute("aria-pressed", "true");
    expect(scoreboard).toHaveAttribute("aria-pressed", "false");
  });

  it("returns home from the logo button", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    const logo = document.querySelector(".logo-button") as HTMLElement;
    await user.click(logo);
    expect(screen.getByText("Use Local Spreadsheet")).toBeInTheDocument();
  });

  it("recalculates on refresh", async () => {
    getPlayerScoresMock.mockResolvedValue(openWeekScores);
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    expect(getPlayerScoresMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(
        screen.getByText("Results successfully updated"),
      ).toBeInTheDocument();
    });
    expect(getPlayerScoresMock).toHaveBeenCalledTimes(2);
  });

  it("collapses refresh away once every game is final", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    // Waited for, because the button stays mounted while it animates out.
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Refresh" }),
      ).not.toBeInTheDocument();
    });
    expect(
      document.querySelector(".home__scores-header-divider"),
    ).not.toBeInTheDocument();
  });

  it("offers refresh while a game is still to be played", async () => {
    getPlayerScoresMock.mockResolvedValue(openWeekScores);
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(
      document.querySelector(".home__scores-header-divider"),
    ).toBeInTheDocument();
  });

  it("reports a scoring failure instead of crashing", async () => {
    getPlayerScoresMock.mockResolvedValue(openWeekScores);
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    getPlayerScoresMock.mockRejectedValueOnce(new Error("bad spreadsheet"));

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          `Failed to calculate scores for week ${CURRENT_WEEK}.`,
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("the app, export", () => {
  it("builds and downloads a spreadsheet for the selected week", async () => {
    const user = await mountLoadedApp();
    await uploadSpreadsheet(user);
    await waitFor(() => {
      expect(screen.getByText("Export Results")).toBeEnabled();
    });

    const click = vi.spyOn(HTMLAnchorElement.prototype, "click");
    await user.click(screen.getByText("Export Results"));

    await waitFor(() => {
      expect(buildSpreadsheetBufferMock).toHaveBeenCalledWith(
        scores,
        CURRENT_WEEK,
      );
    });
    expect(click).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.getByText("Exported results spreadsheet"),
      ).toBeInTheDocument();
    });
  });
});

import { MockedFunction } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ToastContextProvider } from "../context/ToastContext";
import { League, LeagueInfo, SeasonType, WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import RakSadness from "./RakSadness";
import Toaster from "./toaster/Toaster";

vi.mock("../utils/getLeagueInfo");
vi.mock("../utils/getPlayerScores");
vi.mock("../utils/buildSpreadsheetBuffer");

import getLeagueInfo from "../utils/getLeagueInfo";
import { getPlayerScores, readFileToBuffer } from "../utils/getPlayerScores";
import buildSpreadsheetBuffer from "../utils/buildSpreadsheetBuffer";

const getLeagueInfoMock = getLeagueInfo as MockedFunction<typeof getLeagueInfo>;
const getPlayerScoresMock = getPlayerScores as MockedFunction<
  typeof getPlayerScores
>;
const readFileToBufferMock = readFileToBuffer as MockedFunction<
  typeof readFileToBuffer
>;
const buildSpreadsheetBufferMock = buildSpreadsheetBuffer as MockedFunction<
  typeof buildSpreadsheetBuffer
>;

const CURRENT_WEEK = 3;

function week(value: number): WeekInfo {
  return {
    value,
    label: `Week ${value}`,
    startDate: new Date(2024, 8, value),
    endDate: new Date(2024, 8, value + 6),
  };
}

const weeks = [week(1), week(2), week(3), week(4), week(5)];

const leagueInfo: LeagueInfo = {
  league: League.PRO,
  activeCalendar: {
    seasonType: SeasonType.REGULAR,
    startDate: new Date(2024, 8, 1),
    endDate: new Date(2025, 0, 1),
    weeks,
  },
  // Same object as the matching entry in `weeks`, which is what the week Select
  // compares against.
  activeWeek: weeks[CURRENT_WEEK - 1],
  calendars: [],
};

const scores: RakMadnessScores = {
  tiebreaker: 47,
  scores: [
    {
      name: "Alice",
      score: { total: 5, college: 2, pro: 3, proAgainstTheSpread: 3 },
      tiebreaker: { pick: 45, distance: 2 },
      college: [
        {
          pick: "MICH",
          status: "yes",
          explanation: { header: "C1", message: "won" },
        },
      ],
      pro: [
        {
          pick: "BUF",
          status: "yes",
          explanation: { header: "P1", message: "won" },
        },
      ],
      status: { hasNoPicks: false, isKnockedOut: false },
    },
  ],
};

/** Mirrors index.tsx: toasts only appear if Toaster is mounted beside the app. */
function mountApp() {
  const user = userEvent.setup();
  render(
    <ToastContextProvider>
      <RakSadness />
      <Toaster />
    </ToastContextProvider>,
  );
  return user;
}

/** The app only renders its controls once the ESPN week lookup resolves. */
async function mountLoadedApp() {
  const user = mountApp();
  await screen.findByText("Use Local Spreadsheet");
  return user;
}

function fileInput(): HTMLInputElement {
  // The input is hidden behind a button, so target it directly.
  return document.querySelector("input[type=file]") as HTMLInputElement;
}

async function uploadSpreadsheet(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["picks"], "picks.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await user.upload(fileInput(), file);
}

/** Scoreboard, Explanation, Refresh, in the order RakSadness renders them. */
function scoresHeaderButtons(): Array<HTMLElement> {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".home__scores-header-button"),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getLeagueInfoMock.mockResolvedValue(leagueInfo);
  getPlayerScoresMock.mockResolvedValue(scores);
  readFileToBufferMock.mockResolvedValue(new ArrayBuffer(8));
  buildSpreadsheetBufferMock.mockResolvedValue(new ArrayBuffer(8));
  global.fetch = vi.fn();
  window.URL.createObjectURL = vi.fn(() => "blob:fake");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RakSadness, first load", () => {
  it("asks ESPN for the pro league calendar", async () => {
    await mountLoadedApp();
    expect(getLeagueInfoMock).toHaveBeenCalledWith(League.PRO);
  });

  it("hides the controls until the week lookup resolves", () => {
    let resolve: (info: LeagueInfo) => void = () => undefined;
    getLeagueInfoMock.mockReturnValue(
      new Promise<LeagueInfo>((r) => {
        resolve = r;
      }),
    );
    mountApp();
    expect(screen.queryByText("Use Local Spreadsheet")).not.toBeInTheDocument();
    resolve(leagueInfo);
  });

  it("defaults to the active week", async () => {
    await mountLoadedApp();
    expect(screen.getByRole("combobox")).toHaveTextContent(
      `Week ${CURRENT_WEEK}`,
    );
  });

  it("offers only weeks up to the current one, newest first", async () => {
    const user = await mountLoadedApp();
    await user.click(screen.getByRole("combobox"));
    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Week 3", "Week 2", "Week 1"]);
  });

  it("shows the app title in the navbar", async () => {
    await mountLoadedApp();
    expect(screen.getByText("Rak Madness Scoreboard")).toBeInTheDocument();
  });
});

describe("RakSadness, automatic picks fetch", () => {
  it("skips the API on localhost and invites a local spreadsheet", async () => {
    await mountLoadedApp();
    await waitFor(() => {
      expect(screen.getByText("Missing Picks")).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        `The picks spreadsheet for week ${CURRENT_WEEK} is not yet in the database, but you can use a local spreadsheet if you have one.`,
      ),
    ).toBeInTheDocument();
  });

  it("does not score anything when no picks were fetched", async () => {
    await mountLoadedApp();
    await waitFor(() => {
      expect(screen.getByText("Missing Picks")).toBeInTheDocument();
    });
    expect(getPlayerScoresMock).not.toHaveBeenCalled();
  });

  it("leaves the results buttons disabled with no scores", async () => {
    await mountLoadedApp();
    await waitFor(() => {
      expect(screen.getByText("Missing Picks")).toBeInTheDocument();
    });
    expect(screen.getByText("View Results")).toBeDisabled();
    expect(screen.getByText("Export Results")).toBeDisabled();
  });

  it("re-fetches when the week changes", async () => {
    const user = await mountLoadedApp();
    await waitFor(() => {
      expect(screen.getByText("Missing Picks")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));
    // Base UI mounts the popup in a portal, so the options arrive a tick later.
    await user.click(await screen.findByRole("option", { name: "Week 1" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "The picks spreadsheet for week 1 is not yet in the database, but you can use a local spreadsheet if you have one.",
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("RakSadness, manual spreadsheet upload", () => {
  it("scores the uploaded file for the selected week", async () => {
    const user = await mountLoadedApp();
    await uploadSpreadsheet(user);
    await waitFor(() => {
      expect(getPlayerScoresMock).toHaveBeenCalledTimes(1);
    });
    expect(getPlayerScoresMock.mock.calls[0][0]).toEqual(week(CURRENT_WEEK));
  });

  it("confirms success with a toast", async () => {
    const user = await mountLoadedApp();
    await uploadSpreadsheet(user);
    await waitFor(() => {
      expect(
        screen.getByText("Generated results from picks spreadsheet"),
      ).toBeInTheDocument();
    });
  });

  it("enables the results buttons once scores exist", async () => {
    const user = await mountLoadedApp();
    await uploadSpreadsheet(user);
    await waitFor(() => {
      expect(screen.getByText("View Results")).toBeEnabled();
    });
    expect(screen.getByText("Export Results")).toBeEnabled();
  });

  it("reports an aborted selection when no file is chosen", async () => {
    await mountLoadedApp();
    // userEvent.upload with an empty list fires no change event, which is what
    // a cancelled file dialog looks like to the DOM. Fire it directly.
    fireEvent.change(fileInput(), { target: { files: [] } });
    await waitFor(() => {
      expect(
        screen.getByText("Aborted picks shreadsheet selection"),
      ).toBeInTheDocument();
    });
    expect(getPlayerScoresMock).not.toHaveBeenCalled();
  });
});

describe("RakSadness, results views", () => {
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

  it("switches to the explanation view and back", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));

    const [scoreboard, explanation] = scoresHeaderButtons();
    await user.click(explanation);
    expect(screen.getByText("College Score")).toBeInTheDocument();
    expect(screen.queryByText("MNF Points Pick")).not.toBeInTheDocument();

    await user.click(scoreboard);
    expect(screen.getByText("MNF Points Pick")).toBeInTheDocument();
  });

  it("returns home from the logo button", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    const logo = document.querySelector(".logo-button") as HTMLElement;
    await user.click(logo);
    expect(screen.getByText("Use Local Spreadsheet")).toBeInTheDocument();
  });

  it("recalculates on refresh", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    expect(getPlayerScoresMock).toHaveBeenCalledTimes(1);

    await user.click(scoresHeaderButtons()[2]);

    await waitFor(() => {
      expect(
        screen.getByText("Results successfully updated"),
      ).toBeInTheDocument();
    });
    expect(getPlayerScoresMock).toHaveBeenCalledTimes(2);
  });

  it("reports a scoring failure instead of crashing", async () => {
    const user = await mountWithScores();
    await user.click(screen.getByText("View Results"));
    getPlayerScoresMock.mockRejectedValueOnce(new Error("bad spreadsheet"));

    await user.click(scoresHeaderButtons()[2]);

    await waitFor(() => {
      expect(
        screen.getByText(
          `Failed to calculate scores for week ${CURRENT_WEEK}.`,
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("RakSadness, export", () => {
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

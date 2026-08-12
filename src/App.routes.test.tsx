import { MockedFunction } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { League } from "./types/League";

vi.mock("./utils/getLeagueInfo");
vi.mock("./utils/readFileToBuffer");
vi.mock("./utils/scoring/getPlayerScores");
vi.mock("./utils/buildSpreadsheetBuffer");

import {
  CURRENT_WEEK,
  SEASON,
  leagueInfo,
  getLeagueInfoMock,
  getPlayerScoresMock,
  mountApp,
  mountLoadedApp,
  scoresHeaderButtons,
  spreadsheetResponse,
  routedFetch,
  setUpAppTest,
  week,
} from "./appTestFixtures";

let fetchMock: MockedFunction<typeof fetch>;

beforeEach(() => {
  fetchMock = setUpAppTest();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the app, week routes", () => {
  it("opens a week's scoreboard from its URL", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(await screen.findByText("MNF Points Pick")).toBeInTheDocument();
  });

  it("shows a wireframe table until the results are ready", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(document.querySelector(".table.--skeleton")).toBeInTheDocument();

    await screen.findByText("MNF Points Pick");
    expect(document.querySelector(".table.--skeleton")).not.toBeInTheDocument();
  });

  it("shows every navbar button unavailable while the week loads", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    // Scoreboard, picks, and refresh. `aria-disabled`, not `disabled`: they keep
    // their place in the tab order while there is nothing to switch between.
    const loading = scoresHeaderButtons();
    expect(loading).toHaveLength(3);
    loading.forEach((button) =>
      expect(button).toHaveAttribute("aria-disabled", "true"),
    );

    await screen.findByText("MNF Points Pick");
    scoresHeaderButtons().forEach((button) =>
      expect(button).not.toHaveAttribute("aria-disabled"),
    );
  });

  it("holds the content still while the week loads, keeping the scrollbar's room", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);

    expect(document.querySelector(".page__content")).toHaveClass("--frozen");

    await screen.findByText("College Score");
    expect(document.querySelector(".page__content")).not.toHaveClass(
      "--frozen",
    );
  });

  it("opens a week's picks from its URL", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);

    expect(await screen.findByText("College Score")).toBeInTheDocument();
  });

  it("scores the week named in the URL, not the current one", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/1/scoreboard`);

    await waitFor(() => {
      expect(getPlayerScoresMock).toHaveBeenCalled();
    });
    expect(getPlayerScoresMock.mock.calls[0][0]).toEqual(week(1));
  });

  it("scores the week named in the URL exactly once", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);
    await screen.findByText("MNF Points Pick");

    expect(getPlayerScoresMock).toHaveBeenCalledTimes(1);
  });

  it("scores the season named in the URL", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/picks/${SEASON}/${CURRENT_WEEK}`,
      );
    });
  });

  it("sends /scoreboard to the current week of the newest season with picks", async () => {
    // ESPN answers with whichever season was asked for, which is what tells the
    // app the schedule on hand is the one the redirect is waiting for.
    getLeagueInfoMock.mockImplementation(async (_league, season) => ({
      ...leagueInfo,
      season: season ?? SEASON,
    }));
    global.fetch = routedFetch(spreadsheetResponse, [SEASON - 1]);
    await mountApp("/scoreboard");

    await waitFor(() => {
      expect(getLeagueInfoMock).toHaveBeenCalledWith(League.PRO, SEASON - 1);
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/picks/${SEASON - 1}/${CURRENT_WEEK}`,
      );
    });
  });

  it("sends /picks to the picks view of that week", async () => {
    global.fetch = routedFetch(spreadsheetResponse, [SEASON]);
    await mountApp("/picks");

    expect(await screen.findByText("College Score")).toBeInTheDocument();
    expect(screen.queryByText("MNF Points Pick")).not.toBeInTheDocument();
  });

  it("sends /scoreboard home when the schedule cannot be loaded", async () => {
    getLeagueInfoMock.mockResolvedValue(null);
    global.fetch = routedFetch(spreadsheetResponse, [SEASON]);
    mountApp("/scoreboard");

    // Home, rather than the wireframe it shows while it works out where to go.
    expect(await screen.findByText("Select a week...")).toBeInTheDocument();
  });

  it("sends /scoreboard home when the season has no week behind it", async () => {
    getLeagueInfoMock.mockResolvedValue({
      ...leagueInfo,
      activeWeek: undefined,
    });
    global.fetch = routedFetch(spreadsheetResponse, [SEASON]);
    mountApp("/scoreboard");

    expect(await screen.findByText("Select a week...")).toBeInTheDocument();
  });

  it("shows the scoreboard for a bare week URL", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}`);

    expect(await screen.findByText("MNF Points Pick")).toBeInTheDocument();
  });

  it("sends an unknown path home", async () => {
    await mountLoadedApp("/nonsense");

    expect(screen.getByText("Use Local Spreadsheet")).toBeInTheDocument();
  });
});

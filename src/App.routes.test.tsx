import { MockedFunction } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { League, LeagueInfo } from "./types/League";

vi.mock("./utils/getLeagueInfo");
vi.mock("./utils/readFileToBuffer");
vi.mock("./utils/scoring/getPlayerScores");
vi.mock("./utils/buildSpreadsheetBuffer");

import {
  CURRENT_WEEK,
  SEASON,
  leagueInfo,
  scores,
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

  // Read inside the table, because the navbar's path to victory button carries
  // the same trophy while a week that is still being played collapses it away.
  const crown = () =>
    within(screen.getByRole("table")).queryByTestId("EmojiEventsIcon");

  it("crowns a player still standing at the end of the week", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    await screen.findByText("MNF Points Pick");
    expect(crown()).toBeInTheDocument();
  });

  it("holds the crown back while a game is still to finish", async () => {
    getPlayerScoresMock.mockResolvedValue({
      ...scores,
      scores: [
        {
          ...scores.scores[0],
          pro: [
            {
              pick: "BUF",
              status: "incomplete",
              explanation: { header: "P1", message: "in progress" },
            },
          ],
        },
      ],
    });
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    await screen.findByText("MNF Points Pick");
    expect(
      screen.getByTestId("SentimentVerySatisfiedIcon"),
    ).toBeInTheDocument();
    expect(crown()).not.toBeInTheDocument();
  });

  it("shows a wireframe table until the results are ready", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(document.querySelector(".table.--skeleton")).toBeInTheDocument();

    await screen.findByText("MNF Points Pick");
    expect(document.querySelector(".table.--skeleton")).not.toBeInTheDocument();
  });

  it("shows every navbar button disabled while the week loads", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    // Scoreboard, picks, refresh, and path to victory.
    const loading = scoresHeaderButtons();
    expect(loading).toHaveLength(4);
    loading.forEach((button) => expect(button).toBeDisabled());

    await screen.findByText("MNF Points Pick");
    scoresHeaderButtons().forEach((button) => expect(button).toBeEnabled());
  });

  it("fills the wireframe with rows down to the bottom of the viewport", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    // jsdom reports no layout, so every measurement is zero and the whole
    // viewport counts as spare. That still exercises the row count for real.
    const rows = document.querySelectorAll(".table__filler-row");
    expect(rows.length).toBe(Math.floor(window.innerHeight / 32));
  });

  it("shapes the scoreboard wireframe like the scoreboard", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(
      document.querySelectorAll(".table.--skeleton thead th"),
    ).toHaveLength(8);
  });

  it("shapes the picks wireframe with a column per game", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);

    // Rank, player, and three score columns, plus a middling week's worth of
    // games. The real count is not known until the picks have been read.
    expect(
      document.querySelectorAll(".table.--skeleton thead th"),
    ).toHaveLength(24);
  });

  it("gives the wireframe a row per player of a middling week", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);

    expect(
      document.querySelectorAll(
        ".table.--skeleton tbody tr:not(.table__last-row):not(.table__filler-row)",
      ),
    ).toHaveLength(61);
  });

  it("holds the content still while the week loads, keeping the scrollbar's room", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);

    expect(document.querySelector(".home__content")).toHaveClass("--frozen");

    await screen.findByText("College Score");
    expect(document.querySelector(".home__content")).not.toHaveClass(
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

  it("sends a week with no picks home, explaining why", async () => {
    await mountLoadedApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(await screen.findByText("No Results")).toBeInTheDocument();
    expect(screen.getByText("Use Local Spreadsheet")).toBeInTheDocument();
  });

  it("does not judge a week before the schedule has loaded", async () => {
    let resolve: (info: LeagueInfo) => void = () => undefined;
    getLeagueInfoMock.mockReturnValue(
      new Promise<LeagueInfo>((r) => {
        resolve = r;
      }),
    );
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    expect(screen.queryByText("No Results")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknown Week")).not.toBeInTheDocument();
    resolve(leagueInfo);
    expect(await screen.findByText("No Results")).toBeInTheDocument();
  });

  it("sends a week beyond the season home", async () => {
    await mountLoadedApp(`/${SEASON}/99/scoreboard`);

    expect(await screen.findByText("Unknown Week")).toBeInTheDocument();
    expect(getPlayerScoresMock).not.toHaveBeenCalled();
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

  it("sends a season that is not a year home", async () => {
    await mountLoadedApp(`/nope/${CURRENT_WEEK}/scoreboard`);

    expect(await screen.findByText("Unknown Season")).toBeInTheDocument();
    expect(getPlayerScoresMock).not.toHaveBeenCalled();
  });

  it("sends a week that is not a number home", async () => {
    await mountLoadedApp(`/${SEASON}/abc/scoreboard`);

    expect(await screen.findByText("Unknown Week")).toBeInTheDocument();
    expect(getPlayerScoresMock).not.toHaveBeenCalled();
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

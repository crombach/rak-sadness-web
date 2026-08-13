import { MockedFunction } from "vitest";
import { screen, waitFor } from "@testing-library/react";

vi.mock("./utils/getLeagueInfo");
vi.mock("./utils/readFileToBuffer");
vi.mock("./utils/scoring/getPlayerScores");
vi.mock("./utils/buildSpreadsheetBuffer");

import {
  CURRENT_WEEK,
  SEASON,
  getPlayerScoresMock,
  mountApp,
  mountLoadedApp,
  resultsCaption,
  scoresHeaderButtons,
  spreadsheetResponse,
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

// The guard's own branches are `hooks/useWeekRouteGuard.test.tsx`, the wireframe's
// shape is `table/SkeletonTable.test.tsx`, and the bare-URL redirect is
// `results/CurrentWeekRedirect.test.tsx`. What is left is the wiring between them.
describe("the app: the URL decides which week is fetched, and what shows while it is", () => {
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

  it("shows the scoreboard for a bare week URL", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}`);

    expect(await screen.findByText("MNF Points Pick")).toBeInTheDocument();
  });

  it("names the season and week over each table", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);
    await screen.findByText("MNF Points Pick");

    expect(resultsCaption()).toHaveTextContent(
      `Rak Madness · ${SEASON} Season · Week ${CURRENT_WEEK}`,
    );
  });

  it("names the same week over the picks table", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/picks`);
    await screen.findByText("College Score");

    expect(resultsCaption()).toHaveTextContent(
      `Rak Madness · ${SEASON} Season · Week ${CURRENT_WEEK}`,
    );
  });

  // The week is in the URL before the scores are worked out, so the caption the
  // wireframe wears is the one the table keeps. Nothing under it moves.
  it("names the week over the wireframe, and does not change when the scores land", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);

    const expected = `Rak Madness · ${SEASON} Season · Week ${CURRENT_WEEK}`;
    expect(resultsCaption()).toHaveTextContent(expected);

    await screen.findByText("MNF Points Pick");
    expect(resultsCaption()).toHaveTextContent(expected);
  });

  // `getByText` reads a hidden node, so the attribute is what has to be asserted.
  it("says the week on screen without saying it twice", async () => {
    fetchMock.mockResolvedValue(spreadsheetResponse());
    await mountApp(`/${SEASON}/${CURRENT_WEEK}/scoreboard`);
    await screen.findByText("MNF Points Pick");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: `${SEASON} Week ${CURRENT_WEEK} Scoreboard`,
      }),
    ).toBeInTheDocument();
    expect(resultsCaption()).toHaveAttribute("aria-hidden", "true");
  });

  it("sends an unknown path home", async () => {
    await mountLoadedApp("/nonsense");

    expect(screen.getByText("Use Local Spreadsheet")).toBeInTheDocument();
  });
});

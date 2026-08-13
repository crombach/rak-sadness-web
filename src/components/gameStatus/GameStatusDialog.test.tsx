import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedFunction } from "vitest";
import { GameStatus, HomeAway } from "../../types/ESPN";
import { League, WeekInfo } from "../../types/League";
import { LeagueResult } from "../../types/LeagueResult";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import { WeekGame } from "../../types/WeekGame";
import { POLL_MS } from "../../hooks/useLiveGame";
import GameStatusDialog, { gamesMatching } from "./GameStatusDialog";

vi.mock("../../utils/getLeagueResults");

import { getGameResult } from "../../utils/getLeagueResults";

const getGameResultMock = getGameResult as MockedFunction<typeof getGameResult>;

const WEEK: WeekInfo = {
  value: 5,
  label: "Week 5",
  startDate: new Date("2024-10-01T00:00:00Z"),
  endDate: new Date("2024-10-08T00:00:00Z"),
};
const SEASON = 2024;

function result({
  id,
  home,
  away,
  homeScore,
  awayScore,
  status,
}: {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
}): LeagueResult {
  const isFinal = status === GameStatus.FINAL;
  return {
    id,
    name: `${away} at ${home}`,
    shortName: `${away} @ ${home}`,
    date: new Date("2024-10-06T17:00:00Z"),
    status,
    detailMessage: isFinal ? "Final" : "8:42 - 3rd Quarter",
    isNeutralSite: false,
    home: {
      team: {
        name: `${home} Team`,
        abbreviation: home,
        logoUrl: `https://espn.com/${home}.png`,
      },
      score: homeScore,
      linescores: isFinal ? [homeScore] : [],
    },
    away: {
      team: {
        name: `${away} Team`,
        abbreviation: away,
        logoUrl: `https://espn.com/${away}.png`,
      },
      score: awayScore,
      linescores: isFinal ? [awayScore] : [],
    },
    possession: {},
    winner: {
      team: isFinal ? { name: `${home} Team`, abbreviation: home } : null,
      homeAway: isFinal ? HomeAway.HOME : null,
      by: Math.abs(homeScore - awayScore),
    },
    loser: {
      team: isFinal ? { name: `${away} Team`, abbreviation: away } : null,
      homeAway: isFinal ? HomeAway.AWAY : null,
      by: Math.abs(homeScore - awayScore),
    },
    totalScore: homeScore + awayScore,
  };
}

/** The pro game is live, and the college one finished a while ago. */
const proGame = result({
  id: "401",
  home: "BUF",
  away: "KC",
  homeScore: 7,
  awayScore: 0,
  status: GameStatus.LIVE,
});
const collegeGame = result({
  id: "402",
  home: "OSU",
  away: "MICH",
  homeScore: 20,
  awayScore: 30,
  status: GameStatus.FINAL,
});
const upcomingGame = result({
  id: "403",
  home: "PHI",
  away: "DAL",
  homeScore: 0,
  awayScore: 0,
  status: GameStatus.UPCOMING,
});

const games: Array<WeekGame> = [
  {
    label: "C1",
    league: League.COLLEGE,
    name: collegeGame.shortName,
    result: collegeGame,
  },
  // A column ESPN listed no game for, which is a game the dialog can only report as
  // missing.
  {
    label: "C2",
    league: League.COLLEGE,
    name: "PSU / IOWA",
  },
  {
    label: "P1",
    league: League.PRO,
    name: proGame.shortName,
    result: proGame,
  },
  {
    label: "P2",
    league: League.PRO,
    name: upcomingGame.shortName,
    result: upcomingGame,
  },
];

const scores: RakMadnessScores = { scores: [], games };

/** A promise the case decides when to answer, so a fetch can be left in flight. */
function deferred() {
  let settle: (value: LeagueResult | null) => void = () => undefined;
  const promise = new Promise<LeagueResult | null>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

describe("gamesMatching", () => {
  it("offers every game before anything is typed, in column order", () => {
    expect(gamesMatching(games, "").map((it) => it.label)).toEqual([
      "C1",
      "C2",
      "P1",
      "P2",
    ]);
  });

  it("finds a game by either team", () => {
    expect(gamesMatching(games, "mich").map((it) => it.label)).toEqual(["C1"]);
    expect(gamesMatching(games, "buf").map((it) => it.label)).toEqual(["P1"]);
  });

  it("finds a game by the column it is in, which is what a cell said", () => {
    expect(gamesMatching(games, "P1").map((it) => it.label)).toEqual(["P1"]);
  });

  it("has nothing to offer before a week is scored", () => {
    expect(gamesMatching([], "")).toEqual([]);
  });
});

/*
 * One mounted dialog for the whole file, on purpose: Base UI leaves its scroll lock
 * and focus guards behind, which put a second dialog's search out of reach. What
 * each game reads like is covered against `GameStatusSummary` instead.
 */
describe("GameStatusDialog", () => {
  it("fetches the open game, keeps it up to date, and stops when it is final", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    getGameResultMock.mockResolvedValue(proGame);

    const dialog = (gameLabel?: string, open = true) => (
      <GameStatusDialog
        open={open}
        onOpenChange={() => undefined}
        gameLabel={gameLabel}
        scores={scores}
        week={WEEK}
        season={SEASON}
      />
    );

    // Closed, so there is nothing to watch and nothing is asked for.
    const { rerender } = render(dialog(undefined, false));
    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    expect(getGameResultMock).not.toHaveBeenCalled();

    // Opened on a cell in the pro column.
    rerender(dialog("P1"));
    expect(getGameResultMock).toHaveBeenCalledWith(
      League.PRO,
      WEEK,
      "401",
      SEASON,
    );
    expect(
      screen.getByRole("progressbar", { name: "Fetching the game" }),
    ).toHaveAttribute("aria-busy", "true");

    // Every mark the week could draw, asked for before any game is opened, so a
    // scoreline never comes up and then fills in.
    expect(
      [
        ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
      ].map((link) => link.getAttribute("href")),
    ).toEqual([
      "https://espn.com/OSU.png",
      "https://espn.com/MICH.png",
      "https://espn.com/BUF.png",
      "https://espn.com/KC.png",
      "https://espn.com/PHI.png",
      "https://espn.com/DAL.png",
    ]);

    // The game, not the column the cell that opened it was in, and a wireframe
    // rather than the score the week was scored at.
    expect(screen.getByRole("combobox", { name: "Game" })).toHaveValue(
      "KC @ BUF",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading the game");
    // In words as well as in a dot, a red dot alone reading as a decoration.
    expect(screen.getByRole("img", { name: "Live" })).toHaveTextContent("LIVE");

    // The score the fetch came back with, not the one the week was scored at. Waited
    // on by the bar, since the wireframe carries the week's own copy of the game and
    // so already reads the same in places.
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    expect(screen.getByText("8:42 - 3rd Quarter")).toBeInTheDocument();
    expect(screen.getByText("BUF Team")).toBeInTheDocument();

    // Ten seconds on, the same game is asked about again, and the answer replaces
    // what was on screen.
    getGameResultMock.mockResolvedValue(
      result({
        id: "401",
        home: "BUF",
        away: "KC",
        homeScore: 14,
        awayScore: 7,
        status: GameStatus.LIVE,
      }),
    );
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(getGameResultMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("14")).toBeInTheDocument();

    // A poll says it is out the way a first fetch does, and the game already on
    // screen stays up behind the bar rather than a wireframe standing in for it.
    const held = deferred();
    getGameResultMock.mockReturnValue(held.promise);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(
      await screen.findByRole("progressbar", { name: "Fetching the game" }),
    ).toBeInTheDocument();
    expect(screen.getByText("BUF Team")).toBeInTheDocument();

    held.settle(proGame);
    expect(await screen.findByText("0")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();

    // Another game chosen from the search. The one on screen stays there behind the
    // bar until the new one arrives, rather than the dialog emptying and filling.
    const pending = deferred();
    getGameResultMock.mockReturnValue(pending.promise);
    await user.click(screen.getByRole("combobox", { name: "Game" }));

    // Every entry says where its game stands: the live game LIVE, the one that is
    // over a tick, the one yet to start a calendar, and the column ESPN has no game
    // for a warning.
    await screen.findByRole("option", { name: /KC @ BUF/ });

    // Under the search, whatever room is left below it, so the list never covers the
    // game the dialog is already open on.
    expect(screen.getByRole("listbox").closest("[data-side]")).toHaveAttribute(
      "data-side",
      "bottom",
    );

    expect(
      screen.getAllByRole("option").map((option) =>
        within(option)
          .getAllByRole("img")
          .map((mark) => mark.getAttribute("aria-label")),
      ),
    ).toEqual([
      ["Final"],
      ["Not listed by ESPN"],
      ["Live"],
      ["Yet to kick off"],
    ]);
    expect(
      within(screen.getByRole("option", { name: /DAL @ PHI/ })).getByTestId(
        "EventIcon",
      ),
    ).toBeInTheDocument();
    // The two worth acting on say so in a word, the other two in a shape alone.
    expect(screen.getAllByRole("img").map((mark) => mark.textContent)).toEqual([
      "",
      "WARN",
      "LIVE",
      "",
    ]);

    await user.click(screen.getByRole("option", { name: /DAL @ PHI/ }));

    // Choosing ends the search, so a phone's keyboard comes down off the game that
    // was just asked for. The dialog holds the focus rather than nothing.
    expect(screen.getByRole("combobox", { name: "Game" })).not.toHaveFocus();
    expect(document.activeElement).toHaveClass("dialog__popup");

    expect(getGameResultMock).toHaveBeenLastCalledWith(
      League.PRO,
      WEEK,
      "403",
      SEASON,
    );
    expect(
      screen.getByRole("progressbar", { name: "Fetching the game" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("BUF Team")).toBeNull();
    // The game being switched to, which has yet to kick off, rather than the live one
    // whose result is still the last one fetched.
    expect(
      screen.getByRole("img", { name: "Yet to kick off" }),
    ).toBeInTheDocument();

    pending.settle(upcomingGame);
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    expect(screen.getByText("PHI Team")).toBeInTheDocument();
    // Not started, so the search says so rather than that there is something to watch.
    expect(screen.queryByRole("img", { name: /Live/ })).toBeNull();

    // A game the week was already scored on after it finished is shown as it was
    // scored, without being asked for at all. Nothing about it can have changed, and
    // there is nothing left to poll for either.
    const askedBeforeFinal = getGameResultMock.mock.calls.length;
    await user.click(screen.getByRole("combobox", { name: "Game" }));
    await user.click(await screen.findByRole("option", { name: /MICH @ OSU/ }));
    expect(screen.getByText("OSU Team")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("img", { name: "Final" })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(getGameResultMock).toHaveBeenCalledTimes(askedBeforeFinal);

    // The same switch made with the last game's fetch still outstanding. The answer
    // lands after the switch, and the finished game stays where it is.
    const stray = deferred();
    getGameResultMock.mockReturnValue(stray.promise);
    await user.click(screen.getByRole("combobox", { name: "Game" }));
    await user.click(await screen.findByRole("option", { name: /KC @ BUF/ }));
    expect(
      screen.getByRole("progressbar", { name: "Fetching the game" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Game" }));
    await user.click(await screen.findByRole("option", { name: /MICH @ OSU/ }));
    expect(screen.getByText("OSU Team")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();

    stray.settle(proGame);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(screen.getByText("OSU Team")).toBeInTheDocument();
    expect(screen.queryByText("BUF Team")).toBeNull();

    // Back on the live game, which is asked about again on the way in.
    getGameResultMock.mockResolvedValue(proGame);
    await user.click(screen.getByRole("combobox", { name: "Game" }));
    await user.click(await screen.findByRole("option", { name: /KC @ BUF/ }));
    expect(await screen.findByText("BUF Team")).toBeInTheDocument();

    // Closing takes the watch off it, whatever the game is doing.
    rerender(dialog("P1", false));
    const askedByClose = getGameResultMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(getGameResultMock).toHaveBeenCalledTimes(askedByClose);

    vi.useRealTimers();
  });
});

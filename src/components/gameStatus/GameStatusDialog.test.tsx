import { render, screen } from "@testing-library/react";
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
    home: {
      team: { name: `${home} Team`, abbreviation: home },
      score: homeScore,
      linescores: isFinal ? [homeScore] : [],
    },
    away: {
      team: { name: `${away} Team`, abbreviation: away },
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

const games: Array<WeekGame> = [
  {
    label: "C1",
    league: League.COLLEGE,
    name: collegeGame.shortName,
    result: collegeGame,
  },
  {
    label: "P1",
    league: League.PRO,
    name: proGame.shortName,
    result: proGame,
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
      "P1",
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

    // The score the fetch came back with, not the one the week was scored at.
    expect(await screen.findByText("8:42 - 3rd Quarter")).toBeInTheDocument();
    expect(screen.getByText("BUF Team")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();

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

    // Another game chosen from the search. The one on screen stays there behind the
    // bar until the new one arrives, rather than the dialog emptying and filling.
    const pending = deferred();
    getGameResultMock.mockReturnValue(pending.promise);
    await user.click(screen.getByRole("combobox", { name: "Game" }));
    await user.click(await screen.findByRole("option", { name: /MICH @ OSU/ }));

    expect(getGameResultMock).toHaveBeenLastCalledWith(
      League.COLLEGE,
      WEEK,
      "402",
      SEASON,
    );
    expect(
      screen.getByRole("progressbar", { name: "Fetching the game" }),
    ).toBeInTheDocument();
    expect(screen.getByText("BUF Team")).toBeInTheDocument();

    pending.settle(collegeGame);
    expect(await screen.findByText("OSU Team")).toBeInTheDocument();
    expect(screen.queryByText("BUF Team")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();

    // Final, so there is nothing left to ask about.
    const askedByFinal = getGameResultMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(getGameResultMock).toHaveBeenCalledTimes(askedByFinal);

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

import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { MockedFunction } from "vitest";
import { League, WeekInfo } from "../../types/League";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import { WeekGame } from "../../types/WeekGame";
import { finalGame, liveGame } from "../../utils/scoring/leagueResultFixtures";
import { POLL_MS } from "../../hooks/useLiveGame";
import GameStatusDialog from "./GameStatusDialog";

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

const proGame: WeekGame = {
  label: "P1",
  league: League.PRO,
  name: "KC @ BUF",
  result: liveGame({ home: "BUF", away: "KC", homeScore: 7, awayScore: 0 }),
};

const scores: RakMadnessScores = { scores: [], games: [proGame] };

function dialog(
  gameLabel: string | undefined,
  open: boolean,
  onGameFinal: () => void,
  forScores: RakMadnessScores = scores,
) {
  return (
    <GameStatusDialog
      open={open}
      onOpenChange={() => undefined}
      gameLabel={gameLabel}
      scores={forScores}
      week={WEEK}
      season={SEASON}
      onGameFinal={onGameFinal}
    />
  );
}

/**
 * `onGameFinal` is what wires the dialog's own live poll back into the week's
 * scores (`ResultsFrame` passes it the same `refresh` the navbar button calls),
 * so a game going final while the dialog is open rescoreds and plays the
 * table's wipe animation instead of waiting for a manual refresh.
 */
describe("GameStatusDialog onGameFinal", () => {
  it("calls onGameFinal once the polled game goes final, and not again after", async () => {
    vi.useFakeTimers();
    const onGameFinal = vi.fn();
    getGameResultMock.mockResolvedValue(
      liveGame({ home: "BUF", away: "KC", homeScore: 7, awayScore: 0 }),
    );

    const { rerender } = render(dialog(undefined, false, onGameFinal));
    rerender(dialog("P1", true, onGameFinal));
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    expect(onGameFinal).not.toHaveBeenCalled();

    getGameResultMock.mockResolvedValue(
      finalGame({ home: "BUF", away: "KC", homeScore: 24, awayScore: 14 }),
    );
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(onGameFinal).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("img", { name: "Final" }),
    ).toBeInTheDocument();

    // Final stops the poll, so a further wait cannot call it again.
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(onGameFinal).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("does not call onGameFinal for a game already final when opened", async () => {
    vi.useFakeTimers();
    const onGameFinal = vi.fn();
    const settledGame: WeekGame = {
      ...proGame,
      result: finalGame({
        home: "BUF",
        away: "KC",
        homeScore: 24,
        awayScore: 14,
      }),
    };
    const settledScores: RakMadnessScores = {
      scores: [],
      games: [settledGame],
    };

    const { rerender } = render(
      dialog(undefined, false, onGameFinal, settledScores),
    );
    rerender(dialog("P1", true, onGameFinal, settledScores));
    expect(
      await screen.findByRole("img", { name: "Final" }),
    ).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(POLL_MS * 2);

    expect(getGameResultMock).not.toHaveBeenCalled();
    expect(onGameFinal).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

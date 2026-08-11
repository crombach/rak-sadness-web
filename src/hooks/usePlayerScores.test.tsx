import { act, renderHook, waitFor } from "@testing-library/react";
import { PropsWithChildren } from "react";
import { MockedFunction } from "vitest";
import { ToastContextProvider } from "../context/ToastContext";
import { WeekInfo } from "../types/League";
import { RakMadnessScores } from "../types/RakMadnessScores";
import { XLSX_CONTENT_TYPE } from "../utils/buildSpreadsheetBuffer";
import { getPlayerScores } from "../utils/scoring/getPlayerScores";
import usePlayerScores from "./usePlayerScores";

vi.mock("../utils/scoring/getPlayerScores", () => ({
  getPlayerScores: vi.fn(),
}));

const getPlayerScoresMock = getPlayerScores as MockedFunction<
  typeof getPlayerScores
>;

const SEASON = 2024;

function week(value: number): WeekInfo {
  return {
    value,
    label: `Week ${value}`,
    startDate: new Date(2024, 8, value),
    endDate: new Date(2024, 8, value + 6),
  };
}

function scoresFor(week: number): RakMadnessScores {
  return {
    tiebreaker: week,
    scores: [],
  };
}

function wrapper({ children }: PropsWithChildren<object>) {
  return <ToastContextProvider>{children}</ToastContextProvider>;
}

beforeEach(() => {
  localStorage.clear();
  // A fresh Response per call, because a body can only be read once.
  global.fetch = vi.fn(async () =>
    Promise.resolve(
      new Response(new ArrayBuffer(8), {
        status: 200,
        headers: { "content-type": XLSX_CONTENT_TYPE },
      }),
    ),
  ) as unknown as typeof fetch;
});

describe("usePlayerScores", () => {
  it("keeps the newer week's scores when an older run finishes last", async () => {
    let finishWeekOne: (scores: RakMadnessScores) => void = () => undefined;
    getPlayerScoresMock.mockImplementation(
      (selectedWeek) =>
        new Promise<RakMadnessScores>((resolve) => {
          if (selectedWeek.value === 1) {
            finishWeekOne = resolve;
          } else {
            resolve(scoresFor(selectedWeek.value));
          }
        }),
    );

    const { result, rerender } = renderHook(
      ({ selectedWeek }: { selectedWeek: WeekInfo }) =>
        usePlayerScores(selectedWeek, SEASON),
      { initialProps: { selectedWeek: week(1) }, wrapper },
    );

    // Week 2 supersedes week 1 while week 1 is still being scored.
    rerender({ selectedWeek: week(2) });
    await waitFor(() => expect(result.current.scoresWeek).toBe(2));

    // Let week 1 finish and everything it queued run to the end.
    await act(async () => {
      finishWeekOne(scoresFor(1));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.scoresWeek).toBe(2);
    expect(result.current.settledWeek).toBe(2);
    expect(result.current.scores?.tiebreaker).toBe(2);
  });
});

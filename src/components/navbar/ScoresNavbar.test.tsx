import { render, screen } from "@testing-library/react";
import { act } from "react";
import ScoresNavbar, { COLLAPSE_DURATION_MS } from "./ScoresNavbar";

const props = {
  view: "Scoreboard" as const,
  onViewChange: () => undefined,
  onRefresh: () => undefined,
  isRefreshing: false,
};

function liveWrapper() {
  return document.querySelector(".home__scores-header-live");
}

describe("ScoresNavbar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers refresh for a week that is still open", () => {
    render(<ScoresNavbar {...props} isWeekLive />);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(liveWrapper()).not.toHaveClass("--collapsed");
  });

  it("marks them collapsed, and keeps them mounted, while they animate out", () => {
    const { rerender } = render(<ScoresNavbar {...props} isWeekLive />);

    rerender(<ScoresNavbar {...props} isWeekLive={false} />);

    // Still painted, so the transition has something to run on, but out of reach of
    // pointer, keyboard, and screen reader.
    expect(liveWrapper()).toHaveClass("--collapsed");
    expect(liveWrapper()).toHaveAttribute("inert");
    act(() => {
      vi.advanceTimersByTime(COLLAPSE_DURATION_MS - 1);
    });
    expect(liveWrapper()).toBeInTheDocument();
  });

  it("drops them and their divider once the collapse has run", () => {
    const { rerender } = render(<ScoresNavbar {...props} isWeekLive />);

    rerender(<ScoresNavbar {...props} isWeekLive={false} />);
    act(() => {
      vi.advanceTimersByTime(COLLAPSE_DURATION_MS);
    });

    expect(liveWrapper()).not.toBeInTheDocument();
    expect(
      document.querySelector(".home__scores-header-divider"),
    ).not.toBeInTheDocument();
  });

  it("never renders them for a week that arrives decided", () => {
    render(<ScoresNavbar {...props} isWeekLive={false} />);

    expect(liveWrapper()).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refresh" }),
    ).not.toBeInTheDocument();
  });
});

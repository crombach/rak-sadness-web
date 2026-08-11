import { render, screen } from "@testing-library/react";
import { act } from "react";
import ScoresNavbar, { COLLAPSE_DURATION_MS } from "./ScoresNavbar";

const props = {
  view: "Scoreboard" as const,
  onViewChange: () => undefined,
  onRefresh: () => undefined,
  isRefreshing: false,
};

function refreshWrapper() {
  return document.querySelector(".home__scores-header-refresh");
}

describe("ScoresNavbar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers refresh for a week that is still open", () => {
    render(<ScoresNavbar {...props} canRefresh />);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(refreshWrapper()).not.toHaveClass("--collapsed");
  });

  it("marks refresh collapsed, and keeps it mounted, while it animates out", () => {
    const { rerender } = render(<ScoresNavbar {...props} canRefresh />);

    rerender(<ScoresNavbar {...props} canRefresh={false} />);

    // Still painted, so the transition has something to run on, but out of reach of
    // pointer, keyboard, and screen reader.
    expect(refreshWrapper()).toHaveClass("--collapsed");
    expect(refreshWrapper()).toHaveAttribute("inert");
    act(() => {
      vi.advanceTimersByTime(COLLAPSE_DURATION_MS - 1);
    });
    expect(refreshWrapper()).toBeInTheDocument();
  });

  it("drops refresh and its divider once the collapse has run", () => {
    const { rerender } = render(<ScoresNavbar {...props} canRefresh />);

    rerender(<ScoresNavbar {...props} canRefresh={false} />);
    act(() => {
      vi.advanceTimersByTime(COLLAPSE_DURATION_MS);
    });

    expect(refreshWrapper()).not.toBeInTheDocument();
    expect(
      document.querySelector(".home__scores-header-divider"),
    ).not.toBeInTheDocument();
  });

  it("never renders refresh for a week that arrives decided", () => {
    render(<ScoresNavbar {...props} canRefresh={false} />);

    expect(refreshWrapper()).not.toBeInTheDocument();
  });
});

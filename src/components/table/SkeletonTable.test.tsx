import { render, screen } from "@testing-library/react";
import SkeletonTable from "./SkeletonTable";

describe("SkeletonTable", () => {
  it("hides the wireframe from a screen reader", () => {
    render(<SkeletonTable view="Scoreboard" />);
    expect(screen.getByRole("table", { hidden: true })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("marks the table busy while it stands in for one still loading", () => {
    render(<SkeletonTable view="Scoreboard" />);
    expect(screen.getByRole("table", { hidden: true })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("tells a screen reader results are loading, not ~1500 empty cells", () => {
    render(<SkeletonTable view="Picks" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading picks results",
    );
  });

  it("shapes the scoreboard wireframe like the scoreboard", () => {
    render(<SkeletonTable view="Scoreboard" />);
    expect(
      document.querySelectorAll(".table.--skeleton thead th"),
    ).toHaveLength(8);
  });

  it("gives the picks wireframe a column per game of a middling week", () => {
    // Rank, player, and three score columns, plus a middling week's worth of
    // games. The real count is not known until the picks have been read.
    render(<SkeletonTable view="Picks" />);
    expect(
      document.querySelectorAll(".table.--skeleton thead th"),
    ).toHaveLength(24);
  });

  it("stands in for a field the window cannot show at once", () => {
    render(<SkeletonTable view="Picks" />);
    // Which players played is a thing the wireframe cannot know, so it holds no
    // rows of its own and the filler carries the whole table.
    expect(
      document.querySelectorAll(
        ".table.--skeleton tbody tr:not(.table__last-row):not(.table__filler-row)",
      ),
    ).toHaveLength(0);
    // More rows than the window has room for either way, so the wireframe scrolls
    // the way the table it stands in for will and the scrollbar is already there
    // when the week lands. jsdom reports no layout, so what the rows are measured
    // to fill is the whole window and the floor is what shows above it here.
    // `useFillerRows` covers the measuring on its own.
    expect(
      document.querySelectorAll(".table__filler-row").length,
    ).toBeGreaterThan(Math.floor(window.innerHeight / 32));
  });
});

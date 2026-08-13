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

  it("guesses at no row count of its own", () => {
    render(<SkeletonTable view="Picks" />);
    // How many players played is a thing the wireframe cannot know, and the rows
    // below carry it to the bottom of the window whatever the answer is.
    expect(
      document.querySelectorAll(
        ".table.--skeleton tbody tr:not(.table__last-row):not(.table__filler-row)",
      ),
    ).toHaveLength(0);
  });

  it("fills the wireframe with rows down to the bottom of the viewport", () => {
    // jsdom reports no layout, so every measurement is zero and the whole
    // viewport counts as spare. That still exercises the row count for real.
    render(<SkeletonTable view="Scoreboard" />);
    expect(document.querySelectorAll(".table__filler-row")).toHaveLength(
      Math.floor(window.innerHeight / 32),
    );
  });
});

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
});

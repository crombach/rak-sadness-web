import { Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { useIsWeekDecided } from "../../../context/AppDataContext";
import PlayerStatusIcon from "./PlayerStatusIcon";

vi.mock("../../../context/AppDataContext", () => ({
  useIsWeekDecided: vi.fn(),
}));

const mockIsWeekDecided = useIsWeekDecided as Mock;

describe("PlayerStatusIcon", () => {
  it("marks a knocked out player with the skull, week over or not", () => {
    mockIsWeekDecided.mockReturnValue(false);
    const { rerender } = render(<PlayerStatusIcon isKnockedOut />);
    expect(screen.getByTestId("SkullOutlinedIcon")).toBeInTheDocument();

    mockIsWeekDecided.mockReturnValue(true);
    rerender(<PlayerStatusIcon isKnockedOut />);
    expect(screen.getByTestId("SkullOutlinedIcon")).toBeInTheDocument();
  });

  it("smiles while the week is still being played", () => {
    mockIsWeekDecided.mockReturnValue(false);
    render(<PlayerStatusIcon isKnockedOut={false} />);
    expect(
      screen.getByTestId("SentimentVerySatisfiedIcon"),
    ).toBeInTheDocument();
  });

  it("crowns whoever is left standing once the week is over", () => {
    mockIsWeekDecided.mockReturnValue(true);
    render(<PlayerStatusIcon isKnockedOut={false} />);
    expect(screen.getByTestId("EmojiEventsOutlinedIcon")).toBeInTheDocument();
  });
});

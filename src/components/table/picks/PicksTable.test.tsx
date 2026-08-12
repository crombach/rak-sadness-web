import { Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
  Status,
} from "../../../types/RakMadnessScores";
import { Toast, useToastActions } from "../../../context/ToastContext";
import { PlayerAnalysisContextProvider } from "../../../context/PlayerAnalysisContext";
import PicksTable from "./PicksTable";

const showToast = vi.fn();
const clearToasts = vi.fn();

vi.mock("../../../context/ToastContext", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../context/ToastContext")>();
  return { ...actual, useToastActions: vi.fn() };
});

function pick(
  label: string,
  status: Status = "yes",
  explanation = { header: `${label} header`, message: `${label} message` },
): PickResult {
  return { pick: label, status, explanation };
}

function player({
  name,
  college = [pick("C1 pick")],
  pro = [pick("P1 pick")],
  isKnockedOut = false,
}: {
  name: string;
  college?: Array<PickResult>;
  pro?: Array<PickResult>;
  isKnockedOut?: boolean;
}): PlayerScore {
  return {
    name,
    score: { total: 3, college: 1, pro: 2, proAgainstTheSpread: 2 },
    tiebreaker: { pick: 45, distance: 2 },
    college,
    pro,
    status: {
      hasNoPicks: false,
      isKnockedOut,
      explanation: isKnockedOut ? `${name} is out` : undefined,
    },
  };
}

const scores: RakMadnessScores = {
  tiebreaker: 47,
  scores: [
    player({
      name: "Alice",
      college: [pick("MICH"), pick("OSU", "no")],
      pro: [pick("BUF"), pick("KC", "incomplete"), pick("MIA", "error")],
    }),
    player({ name: "Bob", isKnockedOut: true }),
  ],
};

beforeEach(() => {
  showToast.mockClear();
  clearToasts.mockClear();
  (useToastActions as Mock).mockReturnValue({
    showToast,
    removeToast: vi.fn(),
    clearToasts,
  });
});

describe("PicksTable, empty states", () => {
  it("renders nothing without scores", () => {
    const { container } = render(<PicksTable />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when scores are null", () => {
    const { container } = render(<PicksTable scores={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PicksTable, headers", () => {
  it("labels one column per pick, C-prefixed then P-prefixed", () => {
    render(<PicksTable scores={scores} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual([
      "Rank",
      "Player",
      "C1",
      "C2",
      "College Score",
      "P1",
      "P2",
      "P3",
      "Pro Score",
      "Total Score",
    ]);
  });

  it("takes the column count from the first player", () => {
    const uneven: RakMadnessScores = {
      tiebreaker: 47,
      scores: [
        player({ name: "Alice", college: [pick("MICH")], pro: [pick("BUF")] }),
        player({
          name: "Bob",
          college: [pick("OSU"), pick("PSU")],
          pro: [pick("KC")],
        }),
      ],
    };
    render(<PicksTable scores={uneven} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toContain("C1");
    expect(headers).not.toContain("C2");
  });

  it("marks every header cell with its column scope", () => {
    render(<PicksTable scores={scores} />);
    screen
      .getAllByRole("columnheader")
      .forEach((header) => expect(header).toHaveAttribute("scope", "col"));
  });
});

describe("PicksTable, accessible name", () => {
  it("names the table for a screen reader", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Player picks for the week, college and pro games",
    );
  });
});

describe("PicksTable, rows", () => {
  it("ranks players by their position in the list", () => {
    render(<PicksTable scores={scores} />);
    const firstRow = screen.getByText("Alice").closest("tr");
    expect(firstRow).toHaveTextContent("1");
    const secondRow = screen.getByText("Bob").closest("tr");
    expect(secondRow).toHaveTextContent("2");
  });

  it("shows each pick's text", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByText("MICH")).toBeInTheDocument();
    expect(screen.getByText("OSU")).toBeInTheDocument();
    expect(screen.getByText("BUF")).toBeInTheDocument();
  });

  it("shows N/A for a pick with no text", () => {
    const blank: RakMadnessScores = {
      tiebreaker: 47,
      scores: [player({ name: "Alice", college: [pick("")], pro: [pick("")] })],
    };
    render(<PicksTable scores={blank} />);
    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });

  it("tags each pick cell with its status", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByText("MICH").closest("td")).toHaveClass("--yes");
    expect(screen.getByText("OSU").closest("td")).toHaveClass("--no");
    expect(screen.getByText("KC").closest("td")).toHaveClass("--incomplete");
    expect(screen.getByText("MIA").closest("td")).toHaveClass("--error");
  });

  it("announces a pick's status for a screen reader, fill colors aside", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByText("MICH").closest("button")).toHaveTextContent(
      "Right",
    );
    expect(screen.getByText("OSU").closest("button")).toHaveTextContent(
      "Wrong",
    );
    expect(screen.getByText("MIA").closest("button")).toHaveTextContent(
      "Unscoreable",
    );
  });

  it("adds nothing for an incomplete pick, which draws no color either", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByText("KC").closest("button")?.textContent?.trim()).toBe(
      "KC",
    );
  });

  it("shows the college, pro, and total score per player", () => {
    render(<PicksTable scores={scores} />);
    const row = screen.getByText("Alice").closest("tr");
    expect(row).toHaveTextContent("1");
    expect(row).toHaveTextContent("2");
    expect(row).toHaveTextContent("3");
  });
});

describe("PicksTable, pick explanations", () => {
  it("clears existing toasts before showing a new one", async () => {
    const user = userEvent.setup();
    render(<PicksTable scores={scores} />);
    await user.click(screen.getByText("MICH"));
    expect(clearToasts).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("uses the clicked pick's explanation header", async () => {
    const user = userEvent.setup();
    render(<PicksTable scores={scores} />);
    await user.click(screen.getByText("OSU"));
    const toast: Toast = showToast.mock.calls[0][0];
    expect(toast.header).toBe("OSU header");
    expect(toast.type).toBe("neutral");
  });

  it("shows an explanation for a pro pick too", async () => {
    const user = userEvent.setup();
    render(<PicksTable scores={scores} />);
    await user.click(screen.getByText("BUF"));
    expect(showToast.mock.calls[0][0].header).toBe("BUF header");
  });

  it("reports the newest click, not the first", async () => {
    const user = userEvent.setup();
    render(<PicksTable scores={scores} />);
    await user.click(screen.getByText("MICH"));
    await user.click(screen.getByText("KC"));
    expect(showToast).toHaveBeenCalledTimes(2);
    expect(showToast.mock.calls[1][0].header).toBe("KC header");
  });
});

describe("PlayerName, rendered through the table", () => {
  it("marks a knocked-out player", () => {
    render(<PicksTable scores={scores} />);
    expect(screen.getByText("Bob").closest("td")).toHaveClass("--knocked-out");
    expect(screen.getByText("Alice").closest("td")).not.toHaveClass(
      "--knocked-out",
    );
  });

  it("opens the player analysis on click", async () => {
    const user = userEvent.setup();
    const showPlayerAnalysis = vi.fn();
    render(
      <PlayerAnalysisContextProvider showPlayerAnalysis={showPlayerAnalysis}>
        <PicksTable scores={scores} />
      </PlayerAnalysisContextProvider>,
    );
    await user.click(screen.getByText("Bob"));
    expect(showPlayerAnalysis).toHaveBeenCalledWith("Bob");
    expect(showToast).not.toHaveBeenCalled();
  });
});

import { Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
  Status,
} from "../../../types/RakMadnessScores";
import { Toast, useToastContext } from "../../../context/ToastContext";
import ExplanationTable from "./ExplanationTable";

const showToast = vi.fn();
const clearToasts = vi.fn();

vi.mock("../../../context/ToastContext", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../context/ToastContext")>();
  return { ...actual, useToastContext: vi.fn() };
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
  (useToastContext as Mock).mockReturnValue({
    toasts: [],
    showToast,
    removeToast: vi.fn(),
    clearToasts,
  });
});

describe("ExplanationTable, empty states", () => {
  it("renders nothing without scores", () => {
    const { container } = render(<ExplanationTable />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when scores are null", () => {
    const { container } = render(<ExplanationTable scores={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ExplanationTable, headers", () => {
  it("labels one column per pick, C-prefixed then P-prefixed", () => {
    render(<ExplanationTable scores={scores} />);
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
    render(<ExplanationTable scores={uneven} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toContain("C1");
    expect(headers).not.toContain("C2");
  });
});

describe("ExplanationTable, rows", () => {
  it("ranks players by their position in the list", () => {
    render(<ExplanationTable scores={scores} />);
    const firstRow = screen.getByText("Alice").closest("tr");
    expect(firstRow).toHaveTextContent("1");
    const secondRow = screen.getByText("Bob").closest("tr");
    expect(secondRow).toHaveTextContent("2");
  });

  it("shows each pick's text", () => {
    render(<ExplanationTable scores={scores} />);
    expect(screen.getByText("MICH")).toBeInTheDocument();
    expect(screen.getByText("OSU")).toBeInTheDocument();
    expect(screen.getByText("BUF")).toBeInTheDocument();
  });

  it("shows N/A for a pick with no text", () => {
    const blank: RakMadnessScores = {
      tiebreaker: 47,
      scores: [player({ name: "Alice", college: [pick("")], pro: [pick("")] })],
    };
    render(<ExplanationTable scores={blank} />);
    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });

  it("tags each pick cell with its status", () => {
    render(<ExplanationTable scores={scores} />);
    expect(screen.getByText("MICH")).toHaveClass("--yes");
    expect(screen.getByText("OSU")).toHaveClass("--no");
    expect(screen.getByText("KC")).toHaveClass("--incomplete");
    expect(screen.getByText("MIA")).toHaveClass("--error");
  });

  it("shows the college, pro, and total score per player", () => {
    render(<ExplanationTable scores={scores} />);
    const row = screen.getByText("Alice").closest("tr");
    expect(row).toHaveTextContent("1");
    expect(row).toHaveTextContent("2");
    expect(row).toHaveTextContent("3");
  });
});

describe("ExplanationTable, pick explanations", () => {
  it("clears existing toasts before showing a new one", async () => {
    const user = userEvent.setup();
    render(<ExplanationTable scores={scores} />);
    await user.click(screen.getByText("MICH"));
    expect(clearToasts).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("uses the clicked pick's explanation header", async () => {
    const user = userEvent.setup();
    render(<ExplanationTable scores={scores} />);
    await user.click(screen.getByText("OSU"));
    const toast: Toast = showToast.mock.calls[0][0];
    expect(toast.header).toBe("OSU header");
    expect(toast.type).toBe("neutral");
  });

  it("shows an explanation for a pro pick too", async () => {
    const user = userEvent.setup();
    render(<ExplanationTable scores={scores} />);
    await user.click(screen.getByText("BUF"));
    expect(showToast.mock.calls[0][0].header).toBe("BUF header");
  });

  it("reports the newest click, not the first", async () => {
    const user = userEvent.setup();
    render(<ExplanationTable scores={scores} />);
    await user.click(screen.getByText("MICH"));
    await user.click(screen.getByText("KC"));
    expect(showToast).toHaveBeenCalledTimes(2);
    expect(showToast.mock.calls[1][0].header).toBe("KC header");
  });
});

describe("PlayerName, rendered through the table", () => {
  it("marks a knocked-out player", () => {
    render(<ExplanationTable scores={scores} />);
    expect(screen.getByText("Bob").closest("td")).toHaveClass("--knocked-out");
    expect(screen.getByText("Alice").closest("td")).not.toHaveClass(
      "--knocked-out",
    );
  });

  it("explains a player's status on click", async () => {
    const user = userEvent.setup();
    render(<ExplanationTable scores={scores} />);
    await user.click(screen.getByText("Bob"));
    expect(clearToasts).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0].header).toBe("Bob");
    expect(showToast.mock.calls[0][0].message).toBe("Bob is out");
  });
});

import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Toast, ToastContextProvider, useToastContext } from "./ToastContext";

const TOAST_LIFETIME_MS = 5000;

/** Exposes the whole context as buttons plus a rendered list of toast headers. */
function Harness() {
  const { toasts, showToast, removeToast, clearToasts } = useToastContext();
  return (
    <div>
      <ul data-testid="toasts">
        {toasts.map((toast) => (
          <li key={toast.id}>{toast.header}</li>
        ))}
      </ul>
      <button onClick={() => showToast(new Toast("neutral", "A", "a"))}>
        show A
      </button>
      <button onClick={() => showToast(new Toast("neutral", "B", "b"))}>
        show B
      </button>
      <button onClick={() => showToast(new Toast("neutral", "C", "c"))}>
        show C
      </button>
      <button onClick={() => showToast(new Toast("neutral", "D", "d"))}>
        show D
      </button>
      <button onClick={() => removeToast(toasts[0])} disabled={!toasts.length}>
        remove first
      </button>
      <button onClick={clearToasts}>clear</button>
    </div>
  );
}

function mountHarness() {
  // Advancing fake timers is what dismisses toasts, so user-event must not
  // wait on the real clock.
  const user = userEvent.setup({
    advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
  });
  render(
    <ToastContextProvider>
      <Harness />
    </ToastContextProvider>,
  );
  return user;
}

function headers(): Array<string> {
  return Array.from(screen.getByTestId("toasts").children).map(
    (item) => item.textContent ?? "",
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("Toast", () => {
  it("gives every toast a distinct id", () => {
    const first = new Toast("neutral", "A", "a");
    const second = new Toast("neutral", "A", "a");
    expect(first.id).not.toBe(second.id);
  });

  it("keeps the type, header, and message it was given", () => {
    const toast = new Toast("danger", "Error", "it broke");
    expect(toast.type).toBe("danger");
    expect(toast.header).toBe("Error");
    expect(toast.message).toBe("it broke");
  });
});

describe("ToastContextProvider", () => {
  it("starts with no toasts", () => {
    mountHarness();
    expect(headers()).toEqual([]);
  });

  it("shows toasts in the order they arrive", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("show B"));
    expect(headers()).toEqual(["A", "B"]);
  });

  it("keeps only the newest three, dropping the oldest", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("show B"));
    await user.click(screen.getByText("show C"));
    await user.click(screen.getByText("show D"));
    expect(headers()).toEqual(["B", "C", "D"]);
  });

  it("removes a toast by identity, not by position", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("show B"));
    await user.click(screen.getByText("remove first"));
    expect(headers()).toEqual(["B"]);
  });

  it("clears every toast at once", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("show B"));
    await user.click(screen.getByText("clear"));
    expect(headers()).toEqual([]);
  });

  it("auto-dismisses a toast after its lifetime", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    expect(headers()).toEqual(["A"]);

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS - 1);
    });
    expect(headers()).toEqual(["A"]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(headers()).toEqual([]);
  });

  it("auto-dismisses each toast on its own schedule", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS / 2);
    });
    await user.click(screen.getByText("show B"));
    expect(headers()).toEqual(["A", "B"]);

    // A's lifetime is up, B's is not.
    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS / 2);
    });
    expect(headers()).toEqual(["B"]);

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS / 2);
    });
    expect(headers()).toEqual([]);
  });

  it("does not resurrect a cleared toast when its timer fires", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("clear"));

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS);
    });
    expect(headers()).toEqual([]);
  });

  it("dismisses the oldest toast even after it was pushed out by the cap", async () => {
    const user = mountHarness();
    await user.click(screen.getByText("show A"));
    await user.click(screen.getByText("show B"));
    await user.click(screen.getByText("show C"));
    await user.click(screen.getByText("show D"));

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS);
    });
    expect(headers()).toEqual([]);
  });
});

describe("useToastContext outside a provider", () => {
  it("falls back to no-ops rather than throwing", async () => {
    const user = userEvent.setup({
      advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
    });
    render(<Harness />);
    await user.click(screen.getByText("show A"));
    expect(headers()).toEqual([]);
  });
});

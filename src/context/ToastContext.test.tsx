import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  TOAST_LIFETIME_MS,
  Toast,
  ToastContextProvider,
  useToastActions,
  useToasts,
} from "./ToastContext";

/** Exposes the whole context as buttons plus a rendered list of toast headers. */
function Harness() {
  const toasts = useToasts();
  const { showToast, removeToast, clearToasts } = useToastActions();
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

describe("the toast hooks outside a provider", () => {
  it("falls back to no-ops rather than throwing", async () => {
    const user = userEvent.setup({
      advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
    });
    render(<Harness />);
    await user.click(screen.getByText("show A"));
    expect(headers()).toEqual([]);
  });
});

// Counting renders in the component body rather than through React.Profiler:
// Profiler does not report a commit when only a nested context consumer
// re-renders, which is exactly the case under test.
const renders = { actionsOnly: 0, toastList: 0 };

/** Reads the actions and nothing else, the way a player cell does. */
function ActionsOnlyProbe() {
  renders.actionsOnly += 1;
  const { showToast } = useToastActions();
  return <button onClick={() => showToast(new Toast("neutral", "Z", "z"))} />;
}

/** The control: a consumer that reads the list does re-render. */
function ToastListProbe() {
  renders.toastList += 1;
  return <span>{useToasts().length}</span>;
}

describe("toast actions", () => {
  function mountProbes() {
    const user = userEvent.setup({
      advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
    });
    renders.actionsOnly = 0;
    renders.toastList = 0;
    // No StrictMode here on purpose: its double-invoked renders would double
    // every count below.
    render(
      <ToastContextProvider>
        <ActionsOnlyProbe />
        <ToastListProbe />
        <Harness />
      </ToastContextProvider>,
    );
    return user;
  }

  it("does not re-render an actions-only consumer when a toast appears", async () => {
    const user = mountProbes();

    await user.click(screen.getByText("show A"));

    expect(headers()).toEqual(["A"]);
    expect(renders.actionsOnly).toBe(1);
    // The control, proving a toast really did move through the provider.
    expect(renders.toastList).toBe(2);
  });

  it("does not re-render an actions-only consumer when a toast times out", async () => {
    const user = mountProbes();
    await user.click(screen.getByText("show A"));

    act(() => {
      vi.advanceTimersByTime(TOAST_LIFETIME_MS);
    });

    expect(headers()).toEqual([]);
    expect(renders.actionsOnly).toBe(1);
    expect(renders.toastList).toBe(3);
  });
});

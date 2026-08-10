import { ColorPaletteProp } from "@mui/joy";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  Toast,
  ToastContextProvider,
  useToastContext,
} from "../../context/ToastContext";
import Toaster from "./Toaster";

/** Shows one toast per click, so tests can queue them from the outside. */
function ShowToastButton({ toast }: { toast: Toast }) {
  const { showToast } = useToastContext();
  return <button onClick={() => showToast(toast)}>show {toast.header}</button>;
}

function mountToaster(...toasts: Array<Toast>) {
  return render(
    <ToastContextProvider>
      {toasts.map((toast) => (
        <ShowToastButton key={toast.id} toast={toast} />
      ))}
      <Toaster />
    </ToastContextProvider>,
  );
}

async function show(header: string) {
  await userEvent.click(screen.getByRole("button", { name: `show ${header}` }));
}

describe("Toaster", () => {
  it("renders no alerts until a toast is shown", () => {
    mountToaster(new Toast("neutral", "Alice", "Winner!"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders a toast's header and message", async () => {
    mountToaster(new Toast("neutral", "Alice", "Winner!"));
    await show("Alice");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Winner!")).toBeInTheDocument();
  });

  it("renders one alert per queued toast", async () => {
    mountToaster(
      new Toast("neutral", "Alice", "Winner!"),
      new Toast("neutral", "Bob", "Knocked out."),
    );
    await show("Alice");
    await show("Bob");
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  it("dismisses a toast when its close button is clicked", async () => {
    mountToaster(new Toast("neutral", "Alice", "Winner!"));
    await show("Alice");
    const [, closeButton] = screen.getAllByRole("button");
    await userEvent.click(closeButton);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    ["success", "CheckCircleIcon"],
    ["danger", "ReportIcon"],
    ["warning", "WarningIcon"],
    ["neutral", "InfoIcon"],
  ])("shows the %s icon", async (type, iconTestId) => {
    mountToaster(new Toast(type as ColorPaletteProp, "Header", "Message"));
    await show("Header");
    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });
});

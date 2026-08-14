import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import LogoButton, { APP_NAME } from "./LogoButton";

describe("LogoButton", () => {
  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<LogoButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the unlit segments out of the accessible name", () => {
    render(<LogoButton onClick={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAccessibleName(APP_NAME);
  });
});

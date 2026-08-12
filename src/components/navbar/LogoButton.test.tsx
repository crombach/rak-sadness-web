import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import LogoButton from "./LogoButton";

describe("LogoButton", () => {
  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<LogoButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders the logo with empty alt text so it stays decorative", () => {
    render(<LogoButton onClick={() => undefined} />);
    const logo = screen.getByRole("button").querySelector("img");
    expect(logo).toHaveAttribute("src", "/logo192.png");
    expect(logo).toHaveAttribute("alt", "");
  });

  it("gives two logos on the same page their own outline filter", () => {
    render(
      <>
        <LogoButton onClick={() => undefined} />
        <LogoButton onClick={() => undefined} />
      </>,
    );

    const buttons = screen.getAllByRole("button");
    const filterIds = buttons.map(
      (button) => button.querySelector("filter")!.id,
    );
    expect(new Set(filterIds)).toHaveProperty("size", 2);

    buttons.forEach((button, index) => {
      const logo =
        button.querySelector<HTMLImageElement>(".logo-button__logo")!;
      expect(logo.style.filter).toContain(filterIds[index]);
    });
  });
});

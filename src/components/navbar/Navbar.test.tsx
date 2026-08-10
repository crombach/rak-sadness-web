import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders the element it is given on the left", () => {
    render(<Navbar left={<span>logo</span>} />);
    expect(screen.getByText("logo").parentElement).toHaveClass(
      "navbar__content-left",
    );
  });

  it("renders the element it is given on the right", () => {
    render(<Navbar right={<button>refresh</button>} />);
    expect(
      screen.getByRole("button", { name: "refresh" }).parentElement,
    ).toHaveClass("navbar__content-right");
  });
});

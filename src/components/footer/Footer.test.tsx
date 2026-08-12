import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("links to the standings and the repo", () => {
    render(<Footer />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "https://rakmadness.net/standings-pickem",
      "https://github.com/crombach/rak-madness-calculator",
    ]);
  });

  it("opens every link in a new tab without leaking the referrer", () => {
    render(<Footer />);
    screen.getAllByRole("link").forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    });
  });

  it("names each link by its text, not the decorative icon beside it", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Standings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
  });
});

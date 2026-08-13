import { describe, expect, it } from "vitest";
import { finalGame } from "./leagueResultFixtures";
import marginAgainstSpread from "./marginAgainstSpread";

// Buffalo beat Kansas City by ten.
const game = finalGame({
  home: "BUF",
  away: "KC",
  homeScore: 30,
  awayScore: 20,
});

describe("marginAgainstSpread", () => {
  it("gives the winner its margin where no line was written", () => {
    expect(marginAgainstSpread(game, "BUF", 0)).toBe(10);
    expect(marginAgainstSpread(game, "KC", 0)).toBe(-10);
  });

  it("takes what the favored side gave off its margin", () => {
    expect(marginAgainstSpread(game, "BUF", -3)).toBe(7);
    expect(marginAgainstSpread(game, "BUF", -14)).toBe(-4);
  });

  it("adds what the underdog was given to its margin", () => {
    expect(marginAgainstSpread(game, "KC", 14)).toBe(4);
    expect(marginAgainstSpread(game, "KC", 3)).toBe(-7);
  });

  it("reads zero either side of a game that landed on the number", () => {
    expect(marginAgainstSpread(game, "BUF", -10)).toBe(0);
    expect(marginAgainstSpread(game, "KC", 10)).toBe(0);
  });

  it("reads a tie as a push for both sides, which scores for everybody", () => {
    const drawn = finalGame({
      home: "BUF",
      away: "KC",
      homeScore: 20,
      awayScore: 20,
    });
    expect(marginAgainstSpread(drawn, "BUF", 0)).toBe(0);
    expect(marginAgainstSpread(drawn, "KC", 0)).toBe(0);
  });
});

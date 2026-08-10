import findInconsistentSpreadGames from "./validateSpreads";

const GAME_KEYS = ["P1", "P2"];

function rows(...picks: Array<Record<string, any>>) {
  return picks.map((pick, index) => ({ Name: `Player ${index}`, ...pick }));
}

describe("findInconsistentSpreadGames", () => {
  it("accepts opposite spreads on opposite sides of a game", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF +7" }, { P1: "KC -7" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });

  it("accepts the same spread on the same side of a game", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF +7" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });

  it("accepts a game nobody put a spread on", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF" }, { P1: "KC" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });

  it("flags spreads that are not each other's opposite", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF +7" }, { P1: "KC -8" }),
      GAME_KEYS,
    );

    expect([...result.keys()]).toEqual(["P1"]);
    expect(result.get("P1")).toBe(
      'Picks disagree about the spread: "BUF +7" and "KC -8".',
    );
  });

  it("flags the same side of a game carrying two spreads", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF +7" }, { P1: "BUF +3" }),
      GAME_KEYS,
    );

    expect([...result.keys()]).toEqual(["P1"]);
  });

  it("flags a spread only one row carries, which nobody can score against", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF -3" }, { P1: "KC" }),
      GAME_KEYS,
    );

    expect([...result.keys()]).toEqual(["P1"]);
  });

  it("flags each bad game separately and leaves the good ones alone", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF +7", P2: "SF -2" }, { P1: "KC -8", P2: "SEA +2" }),
      GAME_KEYS,
    );

    expect([...result.keys()]).toEqual(["P1"]);
  });

  it("skips the rows that left a game blank", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: undefined }, { P1: "BUF +7" }, { P1: "" }, { P1: "KC -7" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });

  it("skips a cell that names no team, which is what an empty formula reads as", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "undefined" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });

  it("compares half-point spreads exactly", () => {
    const result = findInconsistentSpreadGames(
      rows({ P1: "BUF -3.5" }, { P1: "KC +3.5" }),
      GAME_KEYS,
    );

    expect(result.size).toBe(0);
  });
});

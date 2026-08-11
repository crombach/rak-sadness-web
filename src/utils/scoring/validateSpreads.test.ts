import resolveGameSpreads from "./validateSpreads";

const GAME_KEYS = ["P1", "P2"];

function rows(...picks: Array<Record<string, any>>) {
  return picks.map((pick, index) => ({ Name: `Player ${index}`, ...pick }));
}

describe("resolveGameSpreads", () => {
  it("accepts opposite spreads on opposite sides of a game", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF +7" }, { P1: "KC -7" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: 7 });
  });

  it("accepts the same spread on the same side of a game", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF +7" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: 7 });
  });

  it("accepts a game nobody put a spread on", () => {
    const result = resolveGameSpreads(rows({ P1: "BUF" }, { P1: "KC" }), [
      "P1",
    ]);

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: 0 });
  });

  it("settles on the spread most rows wrote", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF -7" }, { P1: "BUF -7" }, { P1: "BUF 7" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: -7 });
  });

  it("counts both sides of a game towards the same spread", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF -7" }, { P1: "KC +7" }, { P1: "KC -7" }),
      GAME_KEYS,
    );

    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: -7 });
  });

  it("settles nothing on a game split evenly between two spreads", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF +7" }, { P1: "KC -8" }),
      GAME_KEYS,
    );

    expect(result.agreed.has("P1")).toBe(false);
    expect(result.unresolved.get("P1")).toBe(
      'Picks disagree about the spread: "BUF +7" and "KC -8".',
    );
  });

  it("leaves the games that do agree alone", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF +7", P2: "SF -2" }, { P1: "KC -8", P2: "SEA +2" }),
      GAME_KEYS,
    );

    expect([...result.unresolved.keys()]).toEqual(["P1"]);
    expect(result.agreed.get("P2")).toEqual({ team: "SF", spread: -2 });
  });

  it("skips the rows that left a game blank", () => {
    const result = resolveGameSpreads(
      rows({ P1: undefined }, { P1: "BUF +7" }, { P1: "" }, { P1: "KC -7" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: 7 });
  });

  it("skips a cell that names no team, which is what an empty formula reads as", () => {
    const result = resolveGameSpreads(
      rows({ P1: "undefined" }, { P1: "BUF +7" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: 7 });
  });

  it("compares half-point spreads exactly", () => {
    const result = resolveGameSpreads(
      rows({ P1: "BUF -3.5" }, { P1: "KC +3.5" }),
      GAME_KEYS,
    );

    expect(result.unresolved.size).toBe(0);
    expect(result.agreed.get("P1")).toEqual({ team: "BUF", spread: -3.5 });
  });
});

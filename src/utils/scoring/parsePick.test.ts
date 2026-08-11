import parsePick from "./parsePick";

describe("parsePick", () => {
  it("reads a team and a signed spread", () => {
    expect(parsePick("BUF -7")).toEqual({
      teamAbbreviation: "BUF",
      spread: -7,
    });
    expect(parsePick("KC +3.5")).toEqual({
      teamAbbreviation: "KC",
      spread: 3.5,
    });
  });

  it("reads a spread that was written without a sign", () => {
    expect(parsePick("NE 7")).toEqual({ teamAbbreviation: "NE", spread: 7 });
  });

  it("reads a team with no spread", () => {
    expect(parsePick("SF")).toEqual({ teamAbbreviation: "SF", spread: 0 });
  });

  it("keeps the hyphen in an abbreviation that carries one", () => {
    expect(parsePick("M-OH -7")).toEqual({
      teamAbbreviation: "M-OH",
      spread: -7,
    });
    expect(parsePick("M-OH")).toEqual({
      teamAbbreviation: "M-OH",
      spread: 0,
    });
  });

  it("uppercases the abbreviation", () => {
    expect(parsePick("buf -7").teamAbbreviation).toBe("BUF");
  });

  it("names no team for a blank cell, which arrives as a string", () => {
    expect(parsePick("undefined")).toEqual({
      teamAbbreviation: undefined,
      spread: 0,
    });
  });

  it("names no team for a cell holding no team, rather than throwing", () => {
    ["", " ", "+", "-", "-7"].forEach((cell) => {
      expect(parsePick(cell)).toEqual({
        teamAbbreviation: undefined,
        spread: 0,
      });
    });
  });
});

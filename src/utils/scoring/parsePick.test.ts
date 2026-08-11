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

  it("reads a spread written with a space after its sign", () => {
    expect(parsePick("BUF - 7")).toEqual({
      teamAbbreviation: "BUF",
      spread: -7,
    });
  });

  it("ignores space around the whole cell", () => {
    expect(parsePick("  BUF -7  ")).toEqual({
      teamAbbreviation: "BUF",
      spread: -7,
    });
  });

  it("reads an abbreviation that opens with a digit", () => {
    expect(parsePick("49ERS -3")).toEqual({
      teamAbbreviation: "49ERS",
      spread: -3,
    });
  });

  it("keeps the space in an abbreviation of two words", () => {
    expect(parsePick("OLE MISS -3")).toEqual({
      teamAbbreviation: "OLE MISS",
      spread: -3,
    });
    expect(parsePick("K ST")).toEqual({
      teamAbbreviation: "K ST",
      spread: 0,
    });
  });

  it("drops a hyphen left over from a spread written without a space", () => {
    expect(parsePick("BUF--7")).toEqual({
      teamAbbreviation: "BUF",
      spread: -7,
    });
  });

  it("names no team for a cell holding no team, rather than throwing", () => {
    ["", " ", "+", "-", "7"].forEach((cell) => {
      expect(parsePick(cell).teamAbbreviation).toBeUndefined();
    });
  });

  it("reports a spread written with no team in front of it", () => {
    // Harmless, because a pick naming no team is unscoreable either way, and the
    // spread of an unscoreable pick is never added up.
    expect(parsePick("-7")).toEqual({
      teamAbbreviation: undefined,
      spread: -7,
    });
  });
});

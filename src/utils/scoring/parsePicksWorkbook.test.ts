import * as XLSX from "xlsx-js-style";
import parsePicksWorkbook from "./parsePicksWorkbook";

function picksBuffer(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ Name: "Alice", C1: "OSU -3" }]),
    "Picks",
  );
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parsePicksWorkbook, memoized by buffer identity", () => {
  it("parses the same buffer once, answering a second call from the first parse", async () => {
    const buffer = picksBuffer();
    // Two reads per parse: the row objects, then the header row by index.
    const sheetToJson = vi.spyOn(XLSX.utils, "sheet_to_json");

    const first = await parsePicksWorkbook(buffer);
    const second = await parsePicksWorkbook(buffer);

    expect(second).toBe(first);
    expect(sheetToJson).toHaveBeenCalledTimes(2);
  });

  it("parses two different buffers on their own", async () => {
    const sheetToJson = vi.spyOn(XLSX.utils, "sheet_to_json");

    const first = await parsePicksWorkbook(picksBuffer());
    const second = await parsePicksWorkbook(picksBuffer());

    expect(second).not.toBe(first);
    expect(sheetToJson).toHaveBeenCalledTimes(4);
  });
});

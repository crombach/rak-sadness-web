import { readCachedPicks, writeCachedPicks } from "./picksCache";

function buffer(...bytes: Array<number>): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function bytesOf(value: ArrayBuffer | undefined): Array<number> | undefined {
  return value != null ? Array.from(new Uint8Array(value)) : undefined;
}

beforeEach(() => {
  localStorage.clear();
});

describe("picksCache", () => {
  it("reads back what it wrote", () => {
    writeCachedPicks(3, buffer(1, 2, 250));

    expect(bytesOf(readCachedPicks(3))).toEqual([1, 2, 250]);
  });

  it("keeps each week separate", () => {
    writeCachedPicks(3, buffer(3));
    writeCachedPicks(4, buffer(4));

    expect(bytesOf(readCachedPicks(3))).toEqual([3]);
    expect(bytesOf(readCachedPicks(4))).toEqual([4]);
  });

  it("misses on a week that was never cached", () => {
    expect(readCachedPicks(9)).toBeUndefined();
  });

  it("survives a workbook larger than one encoding chunk", () => {
    const big = new Uint8Array(20000).map((_, index) => index % 256);

    writeCachedPicks(5, big.buffer);

    expect(bytesOf(readCachedPicks(5))).toEqual(Array.from(big));
  });

  it("caps how many weeks it holds, keeping the one just written", () => {
    [1, 2, 3, 4].forEach((week) => writeCachedPicks(week, buffer(week)));

    expect(bytesOf(readCachedPicks(4))).toEqual([4]);
    const cached = [1, 2, 3, 4].filter(
      (week) => readCachedPicks(week) != null,
    ).length;
    expect(cached).toBe(3);
  });

  it("treats an entry it cannot decode as a miss", () => {
    writeCachedPicks(3, buffer(1));
    localStorage.setItem("rak-madness:picks:3", "!!!");

    expect(readCachedPicks(3)).toBeUndefined();
  });

  it("leaves nothing behind when storage rejects a write", () => {
    writeCachedPicks(3, buffer(1));
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    writeCachedPicks(4, buffer(4));

    expect(readCachedPicks(3)).toBeUndefined();
    expect(readCachedPicks(4)).toBeUndefined();
    setItem.mockRestore();
  });
});

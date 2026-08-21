import { vi } from "vitest";

// Shared localStorage failure mocks for cache tests: a write that throws quota
// exhaustion, and every Storage method blocked outright.

export function mockRejectedSetItem() {
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
}

export function blockAllStorageMethods() {
  const blocked = () => {
    throw new Error("storage blocked");
  };
  return {
    getItem: vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked),
    setItem: vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked),
    removeItem: vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(blocked),
    key: vi.spyOn(Storage.prototype, "key").mockImplementation(blocked),
    length: vi
      .spyOn(Storage.prototype, "length", "get")
      .mockImplementation(blocked),
  };
}

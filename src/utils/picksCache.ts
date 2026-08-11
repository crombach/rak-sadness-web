// A per-week copy of an uploaded workbook, so a results URL can be reopened
// without asking for the file again. Only the workbook is cached, never the
// scores: recomputing those is fast, and a cached score could go stale against a
// change to the scoring rules.

const KEY_PREFIX = "rak-madness:picks:";
/** A size guard, not a history. Picks files are tens of KB. */
const MAX_CACHED_WEEKS = 3;
// Encoding the whole buffer in one call overflows the argument list, so it goes
// through in slices.
const BASE64_CHUNK_BYTES = 8192;

function keyFor(season: number, week: number): string {
  return `${KEY_PREFIX}${season}:${week}`;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_BYTES) {
    text += String.fromCharCode(
      ...bytes.subarray(offset, offset + BASE64_CHUNK_BYTES),
    );
  }
  return btoa(text);
}

function fromBase64(text: string): ArrayBuffer {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function cachedKeys(): Array<string> {
  const keys: Array<string> = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

function clearCache(): void {
  try {
    cachedKeys().forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // Called from catch blocks that turn a storage failure into a cache miss.
    // If storage is blocked outright, this must not throw past them.
    console.warn("Could not clear picks cache", error);
  }
}

/** The cached workbook for a week, or undefined if there isn't a usable one. */
export function readCachedPicks(
  season: number,
  week: number,
): ArrayBuffer | undefined {
  try {
    const text = localStorage.getItem(keyFor(season, week));
    return text != null ? fromBase64(text) : undefined;
  } catch (error) {
    // A cache is never allowed to break scoring, so a corrupt or unreadable
    // entry counts as a miss.
    console.warn("Could not read cached picks", error);
    clearCache();
    return undefined;
  }
}

export function writeCachedPicks(
  season: number,
  week: number,
  buffer: ArrayBuffer,
): void {
  try {
    // Prune before writing, so the week being written is never the one dropped.
    // localStorage does not report insertion order, so which other weeks go is
    // arbitrary. The cap is only here to bound how much space this takes.
    const keys = cachedKeys().filter((key) => key !== keyFor(season, week));
    keys
      .slice(0, Math.max(keys.length - (MAX_CACHED_WEEKS - 1), 0))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(keyFor(season, week), toBase64(buffer));
  } catch (error) {
    console.warn("Could not cache picks", error);
    clearCache();
  }
}

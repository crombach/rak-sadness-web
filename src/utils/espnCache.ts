// What ESPN has said that it cannot say differently later, kept in this browser so it
// is not asked again. A game that has been played keeps its score, a matchup ESPN
// never listed keeps being a hole, and a season that is over keeps its schedule.
//
// Nothing about the pool is cached, only ESPN's side of it: a spread the workbook
// contradicts itself on, and a cell nobody filled in, are worked out from the picks
// every time, and they cost no request.
//
// Games are filed under the matchup the picks name, so a week whose matchups change
// finds nothing for the ones that moved and asks about those again.

import { GameStatus } from "../types/ESPN";
import { League } from "../types/League";
import { LeagueResult } from "../types/LeagueResult";

const KEY_PREFIX = "rak-madness:espn:";
/** A size guard, not a history. A week of both leagues is tens of KB. */
const MAX_CACHED_WEEKS = 6;
/** Bumped where a stored shape changes, which makes every older entry a miss. */
const VERSION = 1;

/** A game as it was stored, whose date has been through JSON and is text again. */
type StoredGame = (Omit<LeagueResult, "date"> & { date: string }) | null;

type StoredWeek = {
  version: number;
  /** Keyed by matchup. Null is a matchup ESPN listed no game for. */
  games: Record<string, StoredGame>;
};

/** A game ESPN has finished with, or null for a matchup it never listed. */
export type CachedGame = LeagueResult | null;

function resultsKey(season: number, week: number, league: League): string {
  return `${KEY_PREFIX}results:${season}:${week}:${league}`;
}

function calendarKey(league: League, season: number): string {
  return `${KEY_PREFIX}calendar:${league}:${season}`;
}

function cachedKeys(prefix: string): Array<string> {
  const keys: Array<string> = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

function clearCache(): void {
  try {
    cachedKeys(KEY_PREFIX).forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // Called from catch blocks that turn a storage failure into a cache miss. If
    // storage is blocked outright, this must not throw past them.
    console.warn("Could not clear the ESPN cache", error);
  }
}

/** Writes a value, having made room for it, and never throws. */
function store(key: string, prefix: string, cap: number, value: unknown): void {
  try {
    // Pruned before writing, so the entry being written is never the one dropped.
    // localStorage does not report insertion order, so which others go is arbitrary.
    // The cap is only here to bound how much space this takes.
    const keys = cachedKeys(prefix).filter((it) => it !== key);
    keys
      .slice(0, Math.max(keys.length - (cap - 1), 0))
      .forEach((it) => localStorage.removeItem(it));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not cache an ESPN answer", error);
    clearCache();
  }
}

/** Reads a value back, and counts a corrupt or unreadable one as a miss. */
function read<T>(key: string): T | undefined {
  try {
    const text = localStorage.getItem(key);
    return text != null ? (JSON.parse(text) as T) : undefined;
  } catch (error) {
    // A cache is never allowed to break scoring.
    console.warn("Could not read a cached ESPN answer", error);
    clearCache();
    return undefined;
  }
}

/**
 * What a matchup is filed under.
 *
 * Folded and sorted, because the workbook could name the same two teams either way
 * around and in any case at all, while a result carries them already uppercased. A
 * column names one team where every player picked the same side, and none at all
 * where nobody filled it in, both of which are matchups in their own right.
 */
export function matchupKey(teams: Set<string>): string {
  return [...teams]
    .map((team) => team?.toUpperCase())
    .sort()
    .join("|");
}

/** The games this browser has stored for a week, keyed by matchup. */
export function readCachedResults(
  season: number,
  week: number,
  league: League,
): Record<string, CachedGame> {
  const stored = read<StoredWeek>(resultsKey(season, week, league));
  if (stored?.version !== VERSION) {
    return {};
  }
  const games: Record<string, CachedGame> = {};
  Object.entries(stored.games).forEach(([key, game]) => {
    games[key] = game == null ? null : { ...game, date: new Date(game.date) };
  });
  return games;
}

/**
 * Keeps a week's finished games and its holes, dropping whatever it held before.
 *
 * The whole week goes in at once, so a matchup the picks no longer name is not left
 * behind to be answered with.
 */
export function writeCachedResults(
  season: number,
  week: number,
  league: League,
  games: Record<string, CachedGame>,
): void {
  const entry: StoredWeek = {
    version: VERSION,
    games: games as StoredWeek["games"],
  };
  store(
    resultsKey(season, week, league),
    `${KEY_PREFIX}results:`,
    MAX_CACHED_WEEKS,
    entry,
  );
}

/** Whether an answer is one this browser can hold on to for good. */
export function isSettled(game: CachedGame): boolean {
  return game == null || game.status === GameStatus.FINAL;
}

/**
 * A season's calendar as ESPN sent it, or undefined where this browser has none.
 *
 * Held as the response rather than as what the response was read as, so the reading
 * of it stays in one place and a stored date needs no bringing back to life.
 */
export function readCachedCalendar<T>(
  league: League,
  season: number,
): T | undefined {
  return read<T>(calendarKey(league, season));
}

export function writeCachedCalendar(
  league: League,
  season: number,
  scoreboard: unknown,
): void {
  store(
    calendarKey(league, season),
    `${KEY_PREFIX}calendar:`,
    MAX_CACHED_WEEKS,
    scoreboard,
  );
}

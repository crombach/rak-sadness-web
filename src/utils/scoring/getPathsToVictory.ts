import {
  MondayNightOutlook,
  PathsToVictory,
  RemainingPick,
  UncontrolledGame,
  VictoryRoute,
} from "../../types/PathsToVictory";
import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";
import rangeWithPrefix from "../rangeWithPrefix";
import { remainingGameIndices } from "./applyKnockouts";
import { comparePlayerScoresOnMerit } from "./comparePlayerScores";
import parsePick from "./parsePick";

/**
 * The most games still to be played that the routes are worked out for.
 *
 * The search walks every way the open games can fall, so its cost doubles with each
 * one. A Thursday with a full slate left would run to millions of scenarios for an
 * answer too long to read anyway. Above this the caller gets a floor instead.
 */
const MAX_SEARCHED_GAMES = 10;

/** How many routes are carried before the rest are only counted. */
const MAX_LISTED_ROUTES = 10;

type LeagueKey = "college" | "pro";

const LEAGUES: Array<LeagueKey> = ["college", "pro"];

const LEAGUE_PREFIX: Record<LeagueKey, string> = { college: "C", pro: "P" };

type Cell = {
  /** Absent where the player left the game blank, which scores them nothing. */
  team?: string;
  hasSpread: boolean;
  text: string;
};

type RemainingGame = {
  label: string;
  league: LeagueKey;
  /** Every row's cell, in the order the scores hold their players. */
  cells: Array<Cell>;
};

/**
 * Where a player takes a point, as one bit per open game.
 *
 * A bit being set means the game's named team covered. Both directions are kept
 * because the other side of a game is worth a point to whoever picked it, so a
 * player's score has to be read off the outcome twice.
 */
type Gains = {
  setTotal: number;
  clearTotal: number;
  setCollege: number;
  clearCollege: number;
  setSpread: number;
  clearSpread: number;
};

const NO_GAINS: Gains = {
  setTotal: 0,
  clearTotal: 0,
  setCollege: 0,
  clearCollege: 0,
  setSpread: 0,
  clearSpread: 0,
};

type Verdict =
  | { kind: "loss" }
  | { kind: "win" }
  /** Level on points, so the Monday night total between `lo` and `hi` decides it. */
  | { kind: "onTotal"; lo: number; hi: number; contenders: Array<string> };

const LOSS: Verdict = { kind: "loss" };
const WIN: Verdict = { kind: "win" };

function bitCount(value: number): number {
  let count = 0;
  for (let bits = value; bits !== 0; bits &= bits - 1) {
    count += 1;
  }
  return count;
}

/** Every subset of `mask`, largest first, ending at zero. */
function subMasks(mask: number): Array<number> {
  const masks: Array<number> = [];
  for (let subset = mask; ; subset = (subset - 1) & mask) {
    masks.push(subset);
    if (subset === 0) break;
  }
  return masks;
}

/**
 * The games still to be played, read a column at a time.
 *
 * `remainingGameIndices` is the same reading `applyKnockouts` does, and for the same
 * reason: a blank cell scores "error" rather than "incomplete", so one row alone
 * would drop a game that row's player happened to skip.
 */
function remainingGames(players: Array<PlayerScore>): Array<RemainingGame> {
  const [first] = players;
  return LEAGUES.flatMap((league) => {
    const labels = rangeWithPrefix(first[league].length, LEAGUE_PREFIX[league]);
    return remainingGameIndices(players, league).map((index) => ({
      label: labels[index],
      league,
      cells: players.map((player) => {
        const text = player[league][index].pick ?? "";
        const { teamAbbreviation, spread } = parsePick(text);
        return { team: teamAbbreviation, hasSpread: spread !== 0, text };
      }),
    }));
  });
}

function gainsFor(
  playerIndex: number,
  contested: Array<RemainingGame>,
  coverers: Array<string>,
): Gains {
  const gains = { ...NO_GAINS };
  contested.forEach((game, bit) => {
    const cell = game.cells[playerIndex];
    if (cell.team == null) return;
    const mask = 1 << bit;
    const scoresWhenSet = cell.team === coverers[bit];
    if (game.league === "college") {
      if (scoresWhenSet) gains.setCollege |= mask;
      else gains.clearCollege |= mask;
    } else if (cell.hasSpread) {
      // Pro against the spread is a tiebreaker tier of its own, and counts only
      // the pro games that carry a spread.
      if (scoresWhenSet) gains.setSpread |= mask;
      else gains.clearSpread |= mask;
    }
    if (scoresWhenSet) gains.setTotal |= mask;
    else gains.clearTotal |= mask;
  });
  return gains;
}

/** The player's score as the outcome leaves it, every open game counted. */
function projected(
  player: PlayerScore,
  gains: Gains,
  outcome: number,
): PlayerScore {
  const missed = ~outcome;
  const won = (set: number, clear: number) =>
    bitCount(set & outcome) + bitCount(clear & missed);
  const total = player.score.total + won(gains.setTotal, gains.clearTotal);
  const college =
    player.score.college + won(gains.setCollege, gains.clearCollege);
  return {
    ...player,
    score: {
      total,
      college,
      pro: total - college,
      proAgainstTheSpread:
        player.score.proAgainstTheSpread +
        won(gains.setSpread, gains.clearSpread),
    },
  };
}

type Contender = { player: PlayerScore; gains: Gains };

/**
 * Whether one outcome takes the week, and on what.
 *
 * Winning means finishing level with everyone or better. `applyKnockouts` leaves a
 * genuine tie standing and calls both players the winner, so this does too.
 *
 * Where the Monday night game is still to be played nobody has a distance yet, so a
 * dead heat on points is answered as the totals that would win it. The player is
 * closer than a rival on every total on their side of the midpoint between the two
 * guesses. An exact midpoint is a dead heat on Monday night as well, and falls to
 * the tiers below it, which is what `midpointWins` reads.
 */
function evaluate(
  player: PlayerScore,
  gains: Gains,
  contenders: Array<Contender>,
  outcome: number,
  isMondayNightSettled: boolean,
): Verdict {
  const me = projected(player, gains, outcome);
  let lo = 0;
  let hi = Number.POSITIVE_INFINITY;
  const level: Array<string> = [];

  for (const contender of contenders) {
    const them = projected(contender.player, contender.gains, outcome);
    if (them.score.total > me.score.total) return LOSS;
    if (them.score.total < me.score.total) continue;

    const mine = me.tiebreaker.pick;
    const theirs = them.tiebreaker.pick;
    const behindOnLowerTiers = comparePlayerScoresOnMerit(me, them) > 0;
    if (
      isMondayNightSettled ||
      mine == null ||
      theirs == null ||
      mine === theirs
    ) {
      // Monday night cannot separate them, or it already has, so the tiers
      // `comparePlayerScoresOnMerit` runs decide it.
      if (behindOnLowerTiers) return LOSS;
      continue;
    }

    level.push(them.name);
    const midpoint = (mine + theirs) / 2;
    const midpointWins = Number.isInteger(midpoint) && !behindOnLowerTiers;
    if (mine < theirs) {
      hi = Math.min(hi, midpointWins ? midpoint : Math.ceil(midpoint) - 1);
    } else {
      lo = Math.max(lo, midpointWins ? midpoint : Math.floor(midpoint) + 1);
    }
  }

  if (lo > hi) return LOSS;
  return level.length === 0
    ? WIN
    : { kind: "onTotal", lo, hi, contenders: level };
}

/** Prefers a win, then the outcome that leaves the widest range of totals. */
function betterOf(a: Verdict | undefined, b: Verdict): Verdict {
  if (a == null || a.kind === "loss") return b;
  if (b.kind === "loss" || a.kind === "win") return a;
  if (b.kind === "win") return b;
  return b.hi - b.lo > a.hi - a.lo ? b : a;
}

type RouteOutcome = {
  verdict: Verdict;
  /** The way the games out of the player's hands fall, for the best case only. */
  luck: number;
};

/**
 * What a set of the player's own picks landing is worth.
 *
 * `guaranteed` holds the games the player left blank against them, so a route that
 * survives it wins however those fall. Only when nothing survives that are they
 * allowed to fall the player's way, which is where `needsHelp` comes from.
 */
function verdictFor(
  hits: number,
  luckMask: number,
  guaranteed: boolean,
  read: (outcome: number) => Verdict,
): RouteOutcome {
  let lo = 0;
  let hi = Number.POSITIVE_INFINITY;
  const level = new Set<string>();
  let best: Verdict | undefined;
  let bestLuck = 0;

  for (const luck of subMasks(luckMask)) {
    const verdict = read(hits | luck);
    if (!guaranteed) {
      const improved = betterOf(best, verdict);
      if (improved !== best) {
        best = improved;
        bestLuck = luck;
      }
      continue;
    }
    if (verdict.kind === "loss") return { verdict: LOSS, luck: 0 };
    if (verdict.kind === "onTotal") {
      lo = Math.max(lo, verdict.lo);
      hi = Math.min(hi, verdict.hi);
      verdict.contenders.forEach((name) => level.add(name));
    }
  }

  if (!guaranteed) {
    return { verdict: best ?? LOSS, luck: bestLuck };
  }
  if (lo > hi) return { verdict: LOSS, luck: 0 };
  return {
    verdict:
      level.size === 0
        ? WIN
        : { kind: "onTotal", lo, hi, contenders: [...level] },
    luck: 0,
  };
}

function outlookOf(verdict: Verdict, isSettled: boolean): MondayNightOutlook {
  if (verdict.kind !== "onTotal") {
    return isSettled ? { kind: "settled" } : { kind: "notNeeded" };
  }
  return {
    kind: "range",
    min: verdict.lo > 0 ? verdict.lo : undefined,
    max: Number.isFinite(verdict.hi) ? verdict.hi : undefined,
    contenders: verdict.contenders,
  };
}

function sameOutlook(a: MondayNightOutlook, b: MondayNightOutlook): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind !== "range" || b.kind !== "range") return true;
  return (
    a.min === b.min &&
    a.max === b.max &&
    a.contenders.join() === b.contenders.join()
  );
}

/** How many ways `size` of `count` games can be chosen. */
function combinations(count: number, size: number): number {
  let total = 1;
  for (let step = 0; step < size; step++) {
    total = (total * (count - step)) / (step + 1);
  }
  return total;
}

function picksIn(
  mask: number,
  contested: Array<RemainingGame>,
  playerIndex: number,
): Array<RemainingPick> {
  return contested
    .map((game, bit) =>
      (mask & (1 << bit)) === 0
        ? null
        : { label: game.label, pick: game.cells[playerIndex].text },
    )
    .filter((pick) => pick != null);
}

/**
 * The fewest of their own remaining picks the player has to win to reach a rival.
 *
 * A game the two picked differently swings two points, since the point one takes is
 * one the other does not, so those are spent first. A game only the player picked
 * swings one. Undefined where nothing they do is enough, which is the same
 * arithmetic `applyKnockouts` knocks a player out on total score with.
 *
 * A game only the rival picked is assumed to miss, which is what makes this a floor.
 */
function fewestWinsToCatch(
  playerIndex: number,
  rivalIndex: number,
  games: Array<RemainingGame>,
  gap: number,
  clear: boolean,
): number | undefined {
  let different = 0;
  let playerOnly = 0;
  games.forEach((game) => {
    const mine = game.cells[playerIndex].team;
    const theirs = game.cells[rivalIndex].team;
    if (mine == null) return;
    if (theirs == null) playerOnly += 1;
    else if (theirs !== mine) different += 1;
  });

  const target = gap + different + (clear ? 1 : 0);
  if (target <= 0) return 0;
  const onDifferent = Math.min(different, Math.ceil(target / 2));
  const onOwn = Math.max(0, target - onDifferent * 2);
  return onOwn > playerOnly ? undefined : onDifferent + onOwn;
}

function headline(
  player: PlayerScore,
  playerIndex: number,
  rivals: Array<{ player: PlayerScore; index: number }>,
  games: Array<RemainingGame>,
): PathsToVictory {
  let minimumWins = 0;
  let needsMondayNight = false;
  for (const rival of rivals) {
    const gap = rival.player.score.total - player.score.total;
    const toLevel = fewestWinsToCatch(
      playerIndex,
      rival.index,
      games,
      gap,
      false,
    );
    if (toLevel == null) {
      return {
        kind: "eliminated",
        player: player.name,
        explanation: player.status.explanation,
      };
    }
    minimumWins = Math.max(minimumWins, toLevel);
    const toClear = fewestWinsToCatch(
      playerIndex,
      rival.index,
      games,
      gap,
      true,
    );
    if (toClear == null || toClear > toLevel) needsMondayNight = true;
  }
  return {
    kind: "headline",
    player: player.name,
    remainingGameCount: games.length,
    remainingPickCount: games.filter(
      (game) => game.cells[playerIndex].team != null,
    ).length,
    minimumWins,
    needsMondayNight,
  };
}

/**
 * What a player still has to do to win a week that is being played.
 *
 * Undefined where the sheet holds nobody by that name, which is the only way the
 * question has no answer at all.
 */
export default function getPathsToVictory(
  scores: RakMadnessScores,
  playerName: string,
): PathsToVictory | undefined {
  const players = scores.scores;
  const playerIndex = players.findIndex((it) => it.name === playerName);
  if (playerIndex < 0) return undefined;

  const player = players[playerIndex];
  if (player.status.isKnockedOut) {
    return {
      kind: "eliminated",
      player: player.name,
      explanation: player.status.explanation,
    };
  }

  // A player already knocked out cannot take the week off anyone, so they are not
  // measured against. That is what keeps the search small late in a week.
  const rivals = players
    .map((it, index) => ({ player: it, index }))
    .filter((it) => it.index !== playerIndex && !it.player.status.isKnockedOut);
  if (rivals.length === 0) {
    return { kind: "clinched", player: player.name };
  }

  const games = remainingGames(players);
  if (games.length > MAX_SEARCHED_GAMES) {
    return headline(player, playerIndex, rivals, games);
  }

  // A game every live player picked the same way moves all their scores together,
  // in the total and in both tiebreaker tiers, so it cannot change the order and
  // does not need searching.
  const live = [playerIndex, ...rivals.map((it) => it.index)];
  const contested = games.filter(
    (game) => new Set(live.map((index) => game.cells[index].team)).size > 1,
  );

  // The bit for a game reads as the player's own pick landing. Where they have no
  // pick it reads as the first team a live rival took covering, which is a side to
  // measure from and nothing more.
  const coverers = contested.map((game) => {
    const mine = game.cells[playerIndex].team;
    if (mine != null) return mine;
    // A contested game always holds one, since a column every live player left
    // blank cannot differ between them.
    const anyRival = live
      .map((index) => game.cells[index].team)
      .find((team) => team != null);
    return anyRival ?? "";
  });

  const gains = gainsFor(playerIndex, contested, coverers);
  const contenders: Array<Contender> = rivals.map((rival) => ({
    player: rival.player,
    gains: gainsFor(rival.index, contested, coverers),
  }));
  const isMondayNightSettled = scores.tiebreaker != null;
  const read = (outcome: number) =>
    evaluate(player, gains, contenders, outcome, isMondayNightSettled);

  let mineMask = 0;
  let luckMask = 0;
  contested.forEach((game, bit) => {
    if (game.cells[playerIndex].team != null) mineMask |= 1 << bit;
    else luckMask |= 1 << bit;
  });

  const ordered = subMasks(mineMask).sort(
    (a, b) => bitCount(a) - bitCount(b) || a - b,
  );
  const search = (guaranteed: boolean) => {
    const minimal: Array<{ hits: number; outcome: RouteOutcome }> = [];
    let outrightAt: number | undefined;
    for (const hits of ordered) {
      const isRedundant = minimal.some(
        (found) => (found.hits & hits) === found.hits,
      );
      if (isRedundant && outrightAt != null) continue;
      const outcome = verdictFor(hits, luckMask, guaranteed, read);
      if (outcome.verdict.kind === "loss") continue;
      if (outcome.verdict.kind === "win" && outrightAt == null) {
        outrightAt = bitCount(hits);
      }
      if (!isRedundant) minimal.push({ hits, outcome });
    }
    return { minimal, outrightAt };
  };

  // Held against the player first, so a route that survives every way the games
  // they left blank can fall is reported without conditions.
  let found = search(true);
  let needsHelp: Array<UncontrolledGame> = [];
  if (found.minimal.length === 0 && luckMask !== 0) {
    found = search(false);
    const [best] = found.minimal;
    if (best != null) {
      needsHelp = contested
        .map((game, bit): UncontrolledGame | null => {
          const mask = 1 << bit;
          if ((luckMask & mask) === 0) return null;
          const covers = (best.outcome.luck & mask) !== 0;
          const teams = live
            .map((index) => game.cells[index].team)
            .filter((team) => team != null);
          return {
            label: game.label,
            needsToMiss: [
              ...new Set(
                covers
                  ? teams.filter((team) => team !== coverers[bit])
                  : [coverers[bit]],
              ),
            ],
          };
        })
        .filter((game) => game != null);
    }
  }

  const { minimal, outrightAt } = found;
  if (minimal.length === 0) {
    return {
      kind: "eliminated",
      player: player.name,
      explanation: player.status.explanation,
    };
  }
  // Nothing left to win, and nothing the games they left blank can do about it.
  // A route that only survives because those fell right is not a clinch.
  if (
    needsHelp.length === 0 &&
    minimal.length === 1 &&
    minimal[0].hits === 0 &&
    minimal[0].outcome.verdict.kind === "win"
  ) {
    return { kind: "clinched", player: player.name };
  }

  const mustWinMask = minimal.reduce(
    (shared, route) => shared & route.hits,
    minimal[0].hits,
  );
  const rests = minimal.map((route) => ({
    mask: route.hits & ~mustWinMask,
    outlook: outlookOf(route.outcome.verdict, isMondayNightSettled),
  }));
  const isOneOutlook = rests.every((rest) =>
    sameOutlook(rest.outlook, rests[0].outlook),
  );
  const sizes = new Set(rests.map((rest) => bitCount(rest.mask)));
  const poolMask = rests.reduce((all, rest) => all | rest.mask, 0);
  const choose = bitCount(rests[0].mask);
  // Every way of choosing that many of the pool is a route only when there are as
  // many routes as there are ways, since each route is a different one of them.
  const isPool =
    isOneOutlook &&
    sizes.size === 1 &&
    rests.length === combinations(bitCount(poolMask), choose);

  const leader = players[0];
  const base = {
    kind: "paths" as const,
    player: player.name,
    remainingGameCount: games.length,
    pointsBehind: Math.max(0, leader.score.total - player.score.total),
    leader: leader.name,
    mustWin: picksIn(mustWinMask, contested, playerIndex),
    outrightAt,
    needsHelp,
  };

  if (isPool) {
    return {
      ...base,
      pool:
        choose > 0
          ? { choose, games: picksIn(poolMask, contested, playerIndex) }
          : undefined,
      hiddenRouteCount: 0,
      mondayNight: rests[0].outlook,
    };
  }

  // Fewest games first, so the routes asking least of the player are the ones kept
  // and the ones shown before the rest are unfolded.
  const routes: Array<VictoryRoute> = rests
    .map((rest) => ({
      games: picksIn(rest.mask, contested, playerIndex),
      mondayNight: rest.outlook,
    }))
    .sort((a, b) => a.games.length - b.games.length);
  return {
    ...base,
    routes: routes.slice(0, MAX_LISTED_ROUTES),
    hiddenRouteCount: Math.max(0, routes.length - MAX_LISTED_ROUTES),
    mondayNight: isOneOutlook ? rests[0].outlook : undefined,
  };
}

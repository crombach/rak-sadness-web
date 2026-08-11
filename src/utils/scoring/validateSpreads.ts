import parsePick from "./parsePick";

/** A game's spread, written from one team's side of it. */
export type GameSpread = { team: string; spread: number };

export type SpreadResolution = {
  /** The spread the sheet settled on, by game key. */
  agreed: Map<string, GameSpread>;
  /** The games no majority could settle, mapped to the disagreement. */
  unresolved: Map<string, string>;
};

/**
 * The spread each game was played at, taken from the rows that picked it.
 *
 * A spread describes the game, not the player who picked it: two rows on the same
 * side carry the same spread, and two rows on opposite sides carry opposite ones.
 * Where the rows disagree it is a typo in one of them, so the number most of them
 * wrote is the game's, and the odd row out is the one that cannot be scored. One
 * mistyped cell used to cost every player the game.
 *
 * A game split evenly between two spreads has no answer, and comes back
 * unresolved rather than settled by which row happened to come first.
 */
export default function resolveGameSpreads(
  rows: Array<any>,
  gameKeys: Array<string>,
): SpreadResolution {
  const agreed = new Map<string, GameSpread>();
  const unresolved = new Map<string, string>();

  gameKeys.forEach((gameKey) => {
    // Every reading restated from one team's side, so the two ways of writing the
    // same game count as the same number.
    let side: string | undefined;
    const votes = new Map<number, { count: number; pick: string }>();

    rows.forEach((row) => {
      const cell = row[gameKey];
      if (!cell) return;
      const { teamAbbreviation, spread } = parsePick(cell);
      if (teamAbbreviation == null) return;
      side ??= teamAbbreviation;
      const fromSide = teamAbbreviation === side ? spread : -spread;
      const vote = votes.get(fromSide);
      if (vote == null) {
        votes.set(fromSide, { count: 1, pick: cell });
      } else {
        vote.count += 1;
      }
    });

    if (side == null || votes.size === 0) {
      return;
    }
    const ranked = [...votes.entries()].sort((a, b) => b[1].count - a[1].count);
    if (ranked.length > 1 && ranked[0][1].count === ranked[1][1].count) {
      unresolved.set(
        gameKey,
        `Picks disagree about the spread: "${ranked[0][1].pick}" and "${ranked[1][1].pick}".`,
      );
      return;
    }
    agreed.set(gameKey, { team: side, spread: ranked[0][0] });
  });

  return { agreed, unresolved };
}

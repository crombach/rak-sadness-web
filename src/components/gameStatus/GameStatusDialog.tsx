import { useMemo, useState } from "react";
import useArrival from "../../hooks/useArrival";
import useLiveGame from "../../hooks/useLiveGame";
import { WeekInfo } from "../../types/League";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import { WeekGame } from "../../types/WeekGame";
import DialogCombobox from "../dialog/DialogCombobox";
import DialogShell from "../dialog/DialogShell";
import GameStatusSummary from "./GameStatusSummary";
import "./GameStatusDialog.scss";

/** What an entry reads as: the column it is, then the game it holds. */
export function gameLabel(game: WeekGame): string {
  return `${game.label}  ${game.name}`;
}

/**
 * The games a query offers, in picks table column order.
 *
 * Matched against the column label as well as the teams, since the label is half
 * of what an entry reads as, and a reader who came from a cell knows that first.
 */
export function gamesMatching(
  games: Array<WeekGame>,
  query: string,
): Array<WeekGame> {
  const needle = query.trim().toLowerCase();
  return games.filter((game) => gameLabel(game).toLowerCase().includes(needle));
}

/**
 * How a game in the week on screen is going, opened from a pick cell in the picks
 * table.
 *
 * The game is fetched again on the way in and every ten seconds after that until it
 * is final, so a live game on screen is the game as it stands rather than as the
 * week was last scored.
 */
export default function GameStatusDialog({
  open,
  onOpenChange,
  gameLabel: named,
  scores,
  week,
  season,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The column the dialog was opened on, by clicking one of its cells. */
  gameLabel?: string;
  scores?: RakMadnessScores;
  /** Which week the games belong to, which fetching one again needs. */
  week?: WeekInfo;
  /** The year that week's season started in. */
  season?: number;
}) {
  const [game, setGame] = useState<WeekGame>();
  const [query, setQuery] = useState("");

  // Held still between renders, since the combobox reads the chosen game back off
  // this list by identity.
  const games = useMemo(() => scores?.games ?? [], [scores]);

  // A column arriving from outside stands in for a choice made in the search.
  useArrival(named, (label) => {
    const arrived = games.find((it) => it.label === label);
    setGame(arrived);
    setQuery(arrived != null ? gameLabel(arrived) : label);
  });

  const { shown, isLoading } = useLiveGame({
    open,
    game,
    games: scores?.games,
    week,
    season,
  });

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Game Status"
      busy={isLoading}
      busyLabel="Fetching the game"
      search={
        <DialogCombobox<WeekGame>
          ariaLabel="Game"
          placeholder="Search games..."
          emptyMessage="No matching games"
          items={games}
          filteredItems={gamesMatching(games, query)}
          value={game}
          onValueChange={setGame}
          query={query}
          onQueryChange={setQuery}
          itemToStringLabel={gameLabel}
          itemKey={(option) => option.label}
          renderOption={(option) => (
            <>
              <span className="game-status__option-label">{option.label}</span>
              <span className="game-status__option-name">{option.name}</span>
            </>
          )}
        />
      }
    >
      <GameStatusSummary game={game} result={shown} />
    </DialogShell>
  );
}

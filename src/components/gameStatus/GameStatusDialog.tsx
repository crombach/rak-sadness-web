import { useMemo, useState } from "react";
import { preload } from "react-dom";
import useArrival from "../../hooks/useArrival";
import useLiveGame from "../../hooks/useLiveGame";
import { GameStatus } from "../../types/ESPN";
import { WeekInfo } from "../../types/League";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import { WeekGame } from "../../types/WeekGame";
import getClasses from "../../utils/getClasses";
import DialogCombobox from "../dialog/DialogCombobox";
import DialogShell from "../dialog/DialogShell";
import { CheckBoxIcon, EventIcon, WarningIcon } from "../icon/Icon";
import GameStatusSummary from "./GameStatusSummary";
import "./GameStatusDialog.scss";

/**
 * What a query is matched against: the column the game is, then the game itself.
 *
 * Wider than the input reads once a game is chosen, which is the game alone. The
 * column is how a reader who came from a cell knows which game they clicked, so it
 * is worth typing even where it is not worth keeping on screen.
 */
export function gameSearchText(game: WeekGame): string {
  return `${game.label}  ${game.name}`;
}

/** The games a query offers, in picks table column order. */
export function gamesMatching(
  games: Array<WeekGame>,
  query: string,
): Array<WeekGame> {
  const needle = query.trim().toLowerCase();
  return games.filter((game) =>
    gameSearchText(game).toLowerCase().includes(needle),
  );
}

/**
 * Where a game stands, in one mark, on every game the search offers.
 *
 * The two states worth acting on say so in words as well: LIVE beside a red dot for a
 * game being played, and WARN beside a warning for a column ESPN lists no game for,
 * which is the one game the dialog can say nothing else about. A shape alone carries
 * the two that are not: a calendar before kickoff and a tick once the game is over.
 * The dot on the game being watched pulses, since that game is asked about again every
 * ten seconds.
 */
function GameMark({
  game,
  status,
  polling = false,
}: {
  game: WeekGame;
  /** The freshest status known, which for the chosen game is not the scoring pass's. */
  status?: GameStatus;
  polling?: boolean;
}) {
  if (game.result == null) {
    return (
      <span
        className="game-status__mark --invalid"
        role="img"
        aria-label="Not listed by ESPN"
      >
        <WarningIcon />
        WARN
      </span>
    );
  }
  if (status === GameStatus.FINAL) {
    return (
      <span className="game-status__mark --final" role="img" aria-label="Final">
        <CheckBoxIcon />
      </span>
    );
  }
  if (status === GameStatus.LIVE) {
    return (
      <span
        className={`game-status__mark --live ${getClasses({
          "--polling": polling,
        })}`}
        role="img"
        aria-label={polling ? "Live, refreshing" : "Live"}
      >
        {/* Read out by the label above rather than as letters, so a reader being
            read to hears "Live" and not "L I V E". */}
        <span className="game-status__live-dot" />
        LIVE
      </span>
    );
  }
  return (
    <span
      className="game-status__mark --upcoming"
      role="img"
      aria-label="Yet to kick off"
    >
      <EventIcon />
    </span>
  );
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

  // Every mark the week could draw, asked for as soon as the week is scored rather
  // than when a game is opened, so the scoreline comes up with its marks already on
  // it. React holds one request per URL however many renders ask for it.
  games.forEach((it) => {
    [it.result?.home.team.logoUrl, it.result?.away.team.logoUrl].forEach(
      (url) => {
        if (url != null) preload(url, { as: "image" });
      },
    );
  });

  // A column arriving from outside stands in for a choice made in the search.
  useArrival(named, (label) => {
    const arrived = games.find((it) => it.label === label);
    setGame(arrived);
    setQuery(arrived?.name ?? label);
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
          // The game alone. The column is what the list is read by and what the
          // search matches, and saying it back here only crowds the game's name.
          itemToStringLabel={(option) => option.name}
          itemKey={(option) => option.label}
          // The chosen game's own mark, on the freshest status rather than the one
          // the week was scored at, so a game going final stops pulsing. While a
          // fetch is out, `shown` is still the game before it, whose status is not
          // this game's, so the week's own is what stands until the answer lands.
          adornment={
            game != null && (
              <GameMark
                game={game}
                status={
                  (isLoading ? undefined : shown?.status) ?? game.result?.status
                }
                polling
              />
            )
          }
          renderOption={(option) => (
            <>
              <span className="game-status__option-label">{option.label}</span>
              <span className="game-status__option-name">{option.name}</span>
              <GameMark game={option} status={option.result?.status} />
            </>
          )}
        />
      }
    >
      <GameStatusSummary game={game} result={shown} isLoading={isLoading} />
    </DialogShell>
  );
}

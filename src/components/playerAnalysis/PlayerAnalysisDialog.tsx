import { Combobox } from "@base-ui-components/react/combobox";
import { Dialog } from "@base-ui-components/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { PlayerAnalysis } from "../../types/PlayerAnalysis";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getClasses from "../../utils/getClasses";
import getPlayerAnalysis from "../../utils/scoring/getPlayerAnalysis";
import remainingGames from "../../utils/scoring/remainingGames";
import unscoreableGames from "../../utils/scoring/unscoreableGames";
import Button from "../button/Button";
import { CloseRoundedIcon, UnfoldMoreIcon } from "../icon/Icon";
import PlayerStatusIcon from "../table/playerName/PlayerStatusIcon";
import AnalysisSummary, { Standing } from "./AnalysisSummary";
import "./PlayerAnalysisDialog.scss";

export type PlayerOption = { name: string; isKnockedOut: boolean };

export function playerOptions(scores?: RakMadnessScores): Array<PlayerOption> {
  return (
    scores?.scores.map((player) => ({
      name: player.name,
      isKnockedOut: player.status.isKnockedOut,
    })) ?? []
  );
}

/** The players a query offers, in the order the tables rank them. */
export function playersMatching(
  options: Array<PlayerOption>,
  query: string,
): Array<PlayerOption> {
  const needle = query.trim().toLowerCase();
  return options.filter((option) => option.name.toLowerCase().includes(needle));
}

/**
 * Where a player stands in the week on screen, and what they still have to do to
 * win it.
 *
 * A centered modal by default and a sheet up from the bottom edge on a phone. Both
 * are the one Base UI dialog, told apart in the stylesheet, because that is where
 * the rest of the app draws the same line.
 */
export default function PlayerAnalysisDialog({
  open,
  onOpenChange,
  player: named,
  scores,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set where the dialog was opened on one player, by clicking their name. */
  player?: string;
  scores?: RakMadnessScores;
}) {
  const [player, setPlayer] = useState<PlayerOption>();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{
    scores: RakMadnessScores;
    name: string;
    paths?: PlayerAnalysis;
  }>();

  // Held still between renders, since the combobox reads the chosen player back
  // off this list by identity.
  const options = useMemo(() => playerOptions(scores), [scores]);

  // A name arriving from outside stands in for a choice made in the search. Taken
  // during the render that brings it, so the answer is worked out in the same pass
  // rather than a beat behind it.
  const [lastNamed, setLastNamed] = useState(named);
  if (named !== lastNamed) {
    setLastNamed(named);
    setPlayer(options.find((option) => option.name === named));
  }

  // The search is thousands of scenarios and holds the thread while it runs, so
  // it waits for the bar that says so to paint first.
  useEffect(() => {
    if (scores == null || player == null) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() =>
        setFound({
          scores,
          name: player.name,
          paths: getPlayerAnalysis(scores, player.name),
        }),
      );
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [scores, player]);

  // The answer already on screen stays there while the next one is worked out, so
  // moving between players reads as one answer replacing another rather than as the
  // dialog emptying and filling again. Only a rescore takes it away.
  const shown = found?.scores === scores ? found : undefined;
  const isSearching = player != null && shown?.name !== player.name;
  // Read once here, off the same scores, so the header and the "clinched" case
  // below it never work out separately whether the week itself is done.
  // `remainingGames` reads the first row unguarded, so an empty week is short
  // circuited rather than handed to it.
  const players = scores?.scores ?? [];
  // Matches what `Standing` calls over: nothing left to play, and nothing the app
  // could not score. A week with a hole in it has no result to state yet.
  const isOver =
    players.length > 0 &&
    remainingGames(players).length === 0 &&
    unscoreableGames(players).length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="player-analysis__backdrop" />
        <Dialog.Popup className="player-analysis__popup">
          <header className="player-analysis__header">
            <Dialog.Title className="player-analysis__title">
              Player Analysis
            </Dialog.Title>
            <Button
              ariaLabel="Close"
              variant="soft"
              iconOnly
              onClick={() => onOpenChange(false)}
            >
              <CloseRoundedIcon />
            </Button>
          </header>

          <Combobox.Root
            // Remounted on a name arriving from outside, which is what puts that
            // name in the input. The combobox keeps the choice itself, and handing
            // it a value it started without reads as a controlled input arriving
            // late, so a fresh one starts on the right player instead.
            key={named ?? ""}
            defaultValue={player}
            items={options}
            filteredItems={playersMatching(options, query)}
            itemToStringLabel={(option: PlayerOption) => option.name}
            onValueChange={(chosen: PlayerOption | null) =>
              setPlayer(chosen ?? undefined)
            }
            onInputValueChange={setQuery}
            // The list is short and already on screen, so the first match being
            // highlighted saves an arrow key before Enter.
            autoHighlight
          >
            <div className="player-analysis__search">
              <Combobox.Input
                placeholder="Search players..."
                aria-label="Player"
                className="player-analysis__input"
              />
              {/*
                The player named in the input is marked the way the tables mark
                them, so the search says where they stand before the answer below
                it has been worked out.
              */}
              {player != null && (
                <span
                  className={`player-analysis__input-status ${getClasses({
                    "--knocked-out": player.isKnockedOut,
                  })}`}
                >
                  <PlayerStatusIcon isKnockedOut={player.isKnockedOut} />
                </span>
              )}
              <Combobox.Icon className="player-analysis__input-icon">
                <UnfoldMoreIcon />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner
                className="player-analysis__positioner"
                sideOffset={4}
              >
                <Combobox.Popup className="player-analysis__list">
                  <Combobox.Empty className="player-analysis__empty">
                    No matching players
                  </Combobox.Empty>
                  <Combobox.List>
                    {(option: PlayerOption) => (
                      <Combobox.Item
                        key={option.name}
                        value={option}
                        className={`player-analysis__option ${getClasses({
                          "--knocked-out": option.isKnockedOut,
                        })}`}
                      >
                        <span className="player-analysis__option-name">
                          {option.name}
                        </span>
                        <PlayerStatusIcon isKnockedOut={option.isKnockedOut} />
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>

          <div className="player-analysis__body">
            {isSearching && (
              <span
                className="player-analysis__progress"
                role="progressbar"
                aria-busy="true"
                aria-label="Working out the paths"
              />
            )}
            {/* Polite, so a new answer replacing the last one is read once the
                screen reader is free rather than cutting off what it is saying. */}
            <div className="player-analysis__content" aria-live="polite">
              {/* Read off the scores, so it answers for the player picked before
                  their routes have been worked out. */}
              <Standing
                scores={scores}
                player={player?.name}
                result={shown?.paths}
              />
              {/* Keyed on the player, so the answer to a new one plays in rather
                  than replacing the last one in place. */}
              <AnalysisSummary
                key={shown?.name}
                result={shown?.paths}
                isOver={isOver}
              />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

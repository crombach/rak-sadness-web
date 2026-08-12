import { Combobox } from "@base-ui-components/react/combobox";
import { Dialog } from "@base-ui-components/react/dialog";
import { useEffect, useMemo, useState } from "react";
import useViewportInsets from "../../hooks/useViewportInsets";
import { PlayerAnalysis } from "../../types/PlayerAnalysis";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getClasses from "../../utils/getClasses";
import getPlayerAnalysis from "../../utils/scoring/getPlayerAnalysis";
import Button from "../button/Button";
import { CloseRoundedIcon, UnfoldMoreIcon } from "../icon/Icon";
import PlayerStatusIcon from "../table/playerName/PlayerStatusIcon";
import AnalysisSummary from "./AnalysisSummary";
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
  week,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set where the dialog was opened on one player, by clicking their name. */
  player?: string;
  scores?: RakMadnessScores;
  /** Which week the scores are for, which a won week is named by. */
  week?: number;
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

  // Tapping the search opens a keyboard over the bottom of the screen, which the
  // sheet is sized and stood against. Only while the dialog is up, since nothing
  // else on any page has an input to open one.
  useViewportInsets(open);

  // A name arriving from outside stands in for a choice made in the search. Taken
  // during the render that brings it, so the answer is worked out in the same pass
  // rather than a beat behind it.
  //
  // Only an arrival is acted on. The name is cleared as the dialog closes, and
  // taking that would empty the dialog while it is still fading out.
  const [arrived, setArrived] = useState(named);
  if (named !== arrived) {
    setArrived(named);
    if (named != null) {
      setPlayer(options.find((option) => option.name === named));
      setQuery(named);
    }
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

          {/*
            Typed on `PlayerOption | null` rather than on `PlayerOption`, because
            nobody is chosen until a name arrives and a controlled combobox has to
            be handed something other than `undefined` from its first render.
          */}
          <Combobox.Root<PlayerOption | null>
            // The choice and the text in the input are both held here rather than
            // by the combobox, so a name arriving from outside can be taken without
            // the combobox being torn down and rebuilt around it.
            value={player ?? null}
            items={options}
            filteredItems={playersMatching(options, query)}
            itemToStringLabel={(option: PlayerOption | null) =>
              option?.name ?? ""
            }
            // Null arrives when the input is cleared to type another name. The
            // dialog is opened on a player and answers for one from then on, so
            // that clears the search rather than the answer under it.
            onValueChange={(chosen: PlayerOption | null) => {
              if (chosen != null) setPlayer(chosen);
            }}
            // Base UI writes the chosen name back through this on the way out, so
            // dismissing without picking anyone restores it.
            inputValue={query}
            onInputValueChange={setQuery}
            // Tapping the search is the start of looking someone else up, so the
            // name already in it goes rather than being deleted by hand. Only a
            // press: opening by typing reports `input-change`, and wiping that
            // would take the letters that opened the list.
            onOpenChange={(listOpen, details) => {
              if (listOpen && details.reason === "trigger-press") setQuery("");
            }}
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
            <div aria-live="polite">
              <AnalysisSummary
                scores={scores}
                player={player?.name}
                result={shown?.paths}
                week={week}
              />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

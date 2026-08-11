import { Combobox } from "@base-ui-components/react/combobox";
import { Dialog } from "@base-ui-components/react/dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayerAnalysis } from "../../types/PlayerAnalysis";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getClasses from "../../utils/getClasses";
import getPlayerAnalysis from "../../utils/scoring/getPlayerAnalysis";
import Button from "../button/Button";
import { CloseRoundedIcon, SkullIcon, UnfoldMoreIcon } from "../icon/Icon";
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

/**
 * The players a query offers. A knocked out one is named only where the letters
 * typed reach nobody still standing, since their only answer is "no".
 */
export function playersMatching(
  options: Array<PlayerOption>,
  query: string,
): Array<PlayerOption> {
  const needle = query.trim().toLowerCase();
  const matches = options.filter((option) =>
    option.name.toLowerCase().includes(needle),
  );
  const standing = matches.filter((option) => !option.isKnockedOut);
  if (needle.length === 0 || standing.length > 0) return standing;
  return matches;
}

/**
 * What a player still has to do to win the week on screen.
 *
 * A centered modal by default and a sheet up from the bottom edge on a phone. Both
 * are the one Base UI dialog, told apart in the stylesheet, because that is where
 * the rest of the app draws the same line.
 */
export default function PlayerAnalysisDialog({
  open,
  onOpenChange,
  scores,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const standing = useMemo(() => playersMatching(options, ""), [options]);

  // The search is thousands of scenarios and holds the thread while it runs, so
  // it waits for the spinner beside it to paint first.
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

  const isCurrent = found?.scores === scores && found?.name === player?.name;
  const isSearching = player != null && !isCurrent;
  const result = isCurrent ? found?.paths : undefined;

  const body = useRef<HTMLDivElement>(null);
  // The dialog grows to what the answer measures rather than jumping to it. Only
  // the wrapper carries a height, so the summary inside is laid out as usual.
  // Hung off the node itself, since the portal holding it mounts after this.
  const measure = useCallback((content: HTMLDivElement) => {
    const observer = new ResizeObserver(([entry]) => {
      if (body.current == null) return;
      body.current.style.height = `${entry.contentRect.height}px`;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

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
            // Only the players still standing, since the combobox falls back to
            // this list whole once a name has been chosen, rather than to the
            // filtered one below.
            items={standing}
            filteredItems={playersMatching(options, query)}
            itemToStringLabel={(option: PlayerOption) => option.name}
            // The combobox keeps the choice itself. Naming it here as well would
            // hand it a value it started without, which it reads as a controlled
            // input arriving late.
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
                        disabled={option.isKnockedOut}
                        className={`player-analysis__option ${getClasses({
                          "--knocked-out": option.isKnockedOut,
                        })}`}
                      >
                        {option.name}
                        {option.isKnockedOut && <SkullIcon />}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>

          <div className="player-analysis__body" ref={body}>
            <div className="player-analysis__content" ref={measure}>
              <Standing scores={scores} player={player?.name} />
              {isSearching ? (
                <div
                  className="player-analysis__searching"
                  role="status"
                  aria-label="Working out the paths"
                >
                  <span className="player-analysis__spinner" />
                </div>
              ) : (
                // Keyed on the player, so the answer to a new one plays in rather
                // than replacing the last one in place.
                <AnalysisSummary key={player?.name} result={result} />
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { Combobox } from "@base-ui-components/react/combobox";
import { Dialog } from "@base-ui-components/react/dialog";
import { useMemo, useState } from "react";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getClasses from "../../utils/getClasses";
import getPathsToVictory from "../../utils/scoring/getPathsToVictory";
import Button from "../button/Button";
import { CloseRoundedIcon, SkullIcon, UnfoldMoreIcon } from "../icon/Icon";
import VictorySummary from "./VictorySummary";
import "./PathToVictoryDialog.scss";

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
 * The players a query offers. A knocked out one is held back while anyone still
 * standing answers to the same letters, since their only answer is "no".
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
  return standing.length > 0 ? standing : matches;
}

/**
 * What a player still has to do to win the week on screen.
 *
 * A centered modal by default and a sheet up from the bottom edge on a phone. Both
 * are the one Base UI dialog, told apart in the stylesheet, because that is where
 * the rest of the app draws the same line.
 */
export default function PathToVictoryDialog({
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

  // Held still between renders, since the combobox reads the chosen player back
  // off this list by identity.
  const options = useMemo(() => playerOptions(scores), [scores]);
  // The search is thousands of scenarios, so it runs on the player chosen rather
  // than on every render of the dialog around them.
  const result = useMemo(
    () =>
      scores != null && player != null
        ? getPathsToVictory(scores, player.name)
        : undefined,
    [scores, player],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="path-to-victory__backdrop" />
        <Dialog.Popup className="path-to-victory__popup">
          <header className="path-to-victory__header">
            <Dialog.Title className="path-to-victory__title">
              Path to Victory
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
            items={options}
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
            <div className="path-to-victory__search">
              <Combobox.Input
                placeholder="Search players..."
                aria-label="Player"
                className="path-to-victory__input"
              />
              <Combobox.Icon className="path-to-victory__input-icon">
                <UnfoldMoreIcon />
              </Combobox.Icon>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner
                className="path-to-victory__positioner"
                sideOffset={4}
              >
                <Combobox.Popup className="path-to-victory__list">
                  <Combobox.Empty className="path-to-victory__empty">
                    No matching players
                  </Combobox.Empty>
                  <Combobox.List>
                    {(option: PlayerOption) => (
                      <Combobox.Item
                        key={option.name}
                        value={option}
                        disabled={option.isKnockedOut}
                        className={`path-to-victory__option ${getClasses({
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

          <div className="path-to-victory__body">
            <VictorySummary result={result} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { Combobox } from "@base-ui-components/react/combobox";
import { Dialog } from "@base-ui-components/react/dialog";
import { useMemo, useState } from "react";
import { RakMadnessScores } from "../../types/RakMadnessScores";
import getPathsToVictory from "../../utils/scoring/getPathsToVictory";
import Button from "../button/Button";
import { CloseRoundedIcon, UnfoldMoreIcon } from "../icon/Icon";
import VictorySummary from "./VictorySummary";
import "./PathToVictoryDialog.scss";

/**
 * The players worth asking about: the ones who can still win it.
 *
 * A knocked out player has no route to offer, so listing them would only ever be
 * offering an answer of "no".
 */
export function eligiblePlayers(scores?: RakMadnessScores): Array<string> {
  return (
    scores?.scores
      .filter((player) => !player.status.isKnockedOut)
      .map((player) => player.name) ?? []
  );
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
  const [player, setPlayer] = useState<string | null>(null);

  const names = useMemo(() => eligiblePlayers(scores), [scores]);
  // The search is thousands of scenarios, so it runs on the player chosen rather
  // than on every render of the dialog around them.
  const result = useMemo(
    () =>
      scores != null && player != null
        ? getPathsToVictory(scores, player)
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
            items={names}
            value={player}
            onValueChange={setPlayer}
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
                    No player by that name.
                  </Combobox.Empty>
                  <Combobox.List>
                    {(name: string) => (
                      <Combobox.Item
                        key={name}
                        value={name}
                        className="path-to-victory__option"
                      >
                        {name}
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

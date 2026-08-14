import Button from "../button/Button";
import "./LogoButton.scss";

/** Shown in the navbar on every page, whichever view is open. */
export const APP_NAME = "The Rakulator";

/**
 * The character DSEG14 draws with every segment lit. A row of them behind the
 * name is the display's unlit segments, the way a real readout shows the shapes
 * it is not currently using.
 */
const ALL_SEGMENTS_ON = "~";

/**
 * The name with every letter turned into an unlit cell. A space is left alone:
 * the face advances it far narrower than a cell, so filling it too would push
 * every cell after the space clear of the letter it is meant to sit under.
 */
const UNLIT_SEGMENTS = APP_NAME.replace(/\S/g, ALL_SEGMENTS_ON);

export default function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="logo-button">
      {/*
        The name is the element's own text rather than a third span, so that
        running out of room still ends it in an ellipsis. `text-overflow` reaches
        in-flow inline content only, and would skip a positioned one.
      */}
      <span className="logo-button__name">
        <span className="logo-button__name-ghost" aria-hidden="true">
          {UNLIT_SEGMENTS}
        </span>
        {APP_NAME}
      </span>
    </Button>
  );
}

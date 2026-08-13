import { useId } from "react";
import Button from "../button/Button";
import "./LogoButton.scss";

const OUTLINE_RADIUS_PX = 1;

/** Shown in the navbar on every page, whichever view is open. */
export const APP_NAME = "Rakulator";

/**
 * The character DSEG14 draws with every segment lit. A row of them behind the
 * name is the display's unlit segments, the way a real readout shows the shapes
 * it is not currently using.
 */
const ALL_SEGMENTS_ON = "~";

export default function LogoButton({ onClick }: { onClick: () => void }) {
  // Unique per instance, so two logos on the same page never share a filter: an
  // `id` collision would leave both `url(#...)` references pointing at whichever
  // `<filter>` the browser saw first.
  const outlineFilterId = useId();

  return (
    <Button onClick={onClick} className="logo-button">
      {/* Dilating the alpha channel strokes the logo evenly on every side. */}
      <svg className="logo-button__filter" aria-hidden="true" focusable="false">
        <filter
          id={outlineFilterId}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={OUTLINE_RADIUS_PX}
            result="dilated"
          />
          <feFlood floodColor="#fff" result="outlineColor" />
          <feComposite
            in="outlineColor"
            in2="dilated"
            operator="in"
            result="outline"
          />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      <img
        className="logo-button__logo"
        src="/logo192.png"
        alt=""
        style={{ filter: `url(#${outlineFilterId})` }}
      />
      {/*
        The name is the element's own text rather than a third span, so that
        running out of room still ends it in an ellipsis. `text-overflow` reaches
        in-flow inline content only, and would skip a positioned one.
      */}
      <span className="logo-button__name">
        <span className="logo-button__name-ghost" aria-hidden="true">
          {ALL_SEGMENTS_ON.repeat(APP_NAME.length)}
        </span>
        {APP_NAME}
      </span>
    </Button>
  );
}

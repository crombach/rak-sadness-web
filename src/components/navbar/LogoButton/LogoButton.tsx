import Button from "../../button/Button";
import "./LogoButton.scss";

const OUTLINE_FILTER_ID = "logo-button-outline";
const OUTLINE_RADIUS_PX = 1;

/** Shown in the navbar on every page, whichever view is open. */
export const APP_NAME = "The Rakulator";

export default function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="logo-button">
      {/* Dilating the alpha channel strokes the logo evenly on every side. */}
      <svg className="logo-button__filter" aria-hidden="true" focusable="false">
        <filter
          id={OUTLINE_FILTER_ID}
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
      <img className="logo-button__logo" src="/logo192.png" alt="" />
      <span className="logo-button__name">{APP_NAME}</span>
    </Button>
  );
}

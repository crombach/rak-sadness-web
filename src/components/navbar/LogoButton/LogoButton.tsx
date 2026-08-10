import Button from "@mui/joy/Button";
import "./LogoButton.scss";

const OUTLINE_FILTER_ID = "logo-button-outline";
// Whole pixels only. A fractional radius reintroduces the sub-pixel rounding
// that made the old stacked drop-shadows render unevenly in Chrome.
const OUTLINE_RADIUS_PX = 1;

export default function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="solid"
      color="primary"
      onClick={onClick}
      className="logo-button"
    >
      {/*
        Dilating the alpha channel gives a stroke of one fixed width in every
        direction. Stacked drop-shadows only approximate that, and the sub-pixel
        offsets they need rendered unevenly in Chrome.
      */}
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
    </Button>
  );
}

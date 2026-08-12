import {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useState,
} from "react";
import getClasses from "../utils/getClasses";
import { ScreenRotationIcon } from "./icon/Icon";
import Navbar from "./navbar/Navbar";
import "./PageLayout.scss";

const BACKGROUND_TILE = "/logo512.png";

// Read by `PageLayout.scss`, so the file that loads the tile is also the one that
// names it. The color behind the tiles is a token there, not here: it is the
// largest surface in the app and does not belong in a style object.
const BACKGROUND_STYLE = {
  "--rak-background-tile": `url(${BACKGROUND_TILE})`,
} as CSSProperties;

/**
 * Sources that have finished loading once. Every route renders its own layout, so
 * without this the fade would start over on each move between pages.
 */
const loadedSources = new Set<string>();

/**
 * Whether the browser holds the image, so a background drawn from it can be faded
 * in rather than appear all at once. True from the first render once the image has
 * been through here before, which is what keeps the fade to the first page.
 */
function useImageLoaded(source: string): boolean {
  const [isLoaded, setIsLoaded] = useState(() => loadedSources.has(source));

  useEffect(() => {
    if (loadedSources.has(source)) return;
    const image = new Image();
    // Listen before asking, because an image already in the cache still fires
    // `load`, and it can fire as soon as the source is set.
    image.onload = () => {
      loadedSources.add(source);
      setIsLoaded(true);
    };
    image.src = source;
    return () => {
      image.onload = null;
    };
  }, [source]);

  return isLoaded;
}

/** The chrome every page shares: the background, the navbar, and the main area. */
export default function PageLayout({
  title,
  navbarLeft,
  navbarRight,
  showingScores = false,
  scrollable = true,
  children,
}: PropsWithChildren<{
  /**
   * The page's one `<h1>`, drawn nowhere. Every route here is a logo, a bar of
   * controls, and a table, so there is no heading to show, and a page with no
   * `<h1>` gives a screen reader nothing to say about where it has landed.
   */
  title: string;
  navbarLeft: ReactNode;
  navbarRight?: ReactNode;
  showingScores?: boolean;
  /**
   * Set false to refuse the pointer, so what is on screen cannot be scrolled or
   * clicked. The content keeps whatever scrollbars it asks for either way.
   */
  scrollable?: boolean;
}>) {
  const areTilesLoaded = useImageLoaded(BACKGROUND_TILE);

  return (
    <div
      className={`home ${getClasses({ "--tiles-loaded": areTilesLoaded })}`}
      style={BACKGROUND_STYLE}
    >
      <a className="home__skip-link" href="#main">
        Skip to results
      </a>
      <Navbar left={navbarLeft} right={navbarRight} />
      <main
        id="main"
        className={`home__content ${getClasses({
          "--scores": showingScores,
          "--frozen": !scrollable,
        })}`}
      >
        <h1 className="home__title">{title}</h1>
        {children}
      </main>
      {/*
        Drawn only on a phone turned on its side, where the stylesheet covers the
        page with it. `display: none` the rest of the time, so it is out of the
        accessibility tree rather than merely off screen.
      */}
      <div className="home__rotate">
        <span className="home__rotate-icon">
          <ScreenRotationIcon />
        </span>
        <p className="home__rotate-message">Turn your phone upright</p>
        <p className="home__rotate-detail">
          The Rakulator does not support landscape on a phone.
        </p>
      </div>
    </div>
  );
}

import {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useState,
} from "react";
import getClasses from "../utils/getClasses";
import Navbar from "./navbar/Navbar";
import "./PageLayout.scss";

const BACKGROUND_TILE = "/logo512.png";

const BACKGROUND_STYLE = {
  backgroundColor: "#6eaad9",
  // Read by `PageLayout.scss`, so the file that loads the tile is also the one
  // that names it.
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
  navbarLeft,
  navbarRight,
  showingScores = false,
  scrollable = true,
  children,
}: PropsWithChildren<{
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
      <Navbar left={navbarLeft} right={navbarRight} />
      <main
        className={`home__content ${getClasses({
          "--scores": showingScores,
          "--frozen": !scrollable,
        })}`}
      >
        {children}
      </main>
    </div>
  );
}

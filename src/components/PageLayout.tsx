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
 * Whether the browser holds the image, so a background drawn from it can be faded
 * in rather than appear all at once.
 */
function useImageLoaded(source: string): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    // Listen before asking, because an image already in the cache still fires
    // `load`, and it can fire as soon as the source is set.
    image.onload = () => setIsLoaded(true);
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
   * Set false to hold the content still while keeping the room a scrollbar would
   * take, so nothing shifts sideways when scrolling comes back.
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

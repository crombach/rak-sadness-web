import { PropsWithChildren, ReactNode } from "react";
import getClasses from "../utils/getClasses";
import Navbar from "./navbar/Navbar";
import "./PageLayout.scss";

const BACKGROUND_STYLE = {
  backgroundImage: "url(/logo512.png)",
  backgroundColor: "#6eaad9",
};

/** The chrome every page shares: the background, the navbar, and the main area. */
export default function PageLayout({
  navbarLeft,
  navbarRight,
  showingScores = false,
  fillsWidth = false,
  children,
}: PropsWithChildren<{
  navbarLeft: ReactNode;
  navbarRight?: ReactNode;
  showingScores?: boolean;
  /** Widens the content area past its usual column, out to the whole screen. */
  fillsWidth?: boolean;
}>) {
  return (
    <div className="home" style={BACKGROUND_STYLE}>
      <Navbar left={navbarLeft} right={navbarRight} />
      <main
        className={`home__content ${getClasses({
          "--scores": showingScores,
          "--full-width": fillsWidth,
        })}`}
      >
        {children}
      </main>
    </div>
  );
}

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
  return (
    <div className="home" style={BACKGROUND_STYLE}>
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

import { PropsWithChildren, ReactNode } from "react";
import getClasses from "../utils/getClasses";
import Navbar from "./navbar/Navbar";
import "./PageLayout.scss";

/** Shown in the navbar on every page, whichever view is open. */
export const APP_NAME = "Rak Madness Calculator";

const BACKGROUND_STYLE = {
  backgroundImage: "url(/logo512.png)",
  backgroundColor: "#6eaad9",
};

/** The chrome every page shares: the background, the navbar, and the main area. */
export default function PageLayout({
  navbarLeft,
  navbarRight,
  showingScores = false,
  children,
}: PropsWithChildren<{
  navbarLeft: ReactNode;
  navbarRight?: ReactNode;
  showingScores?: boolean;
}>) {
  return (
    <div className="home" style={BACKGROUND_STYLE}>
      <Navbar left={navbarLeft} right={navbarRight} />
      <main
        className={`home__content ${getClasses({
          "--scores": showingScores,
        })}`}
      >
        {children}
      </main>
    </div>
  );
}

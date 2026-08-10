import { ReactNode } from "react";
import "./Navbar.scss";

export default function Navbar({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="navbar">
      <div className="navbar__content">
        <div className="navbar__content-left">{left}</div>
        <div className="navbar__content-right">{right}</div>
      </div>
    </header>
  );
}

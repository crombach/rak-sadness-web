import { ReactElement } from "react";
import { Sheet } from "@mui/joy";
import "./Navbar.scss";

export default function Navbar({
  left,
  right,
}: {
  left?: ReactElement;
  right?: ReactElement;
}) {
  return (
    <Sheet className="navbar" variant="solid" color="primary">
      <div className="navbar__content">
        <div className="navbar__content-left">{left}</div>
        <div className="navbar__content-right">{right}</div>
      </div>
    </Sheet>
  );
}

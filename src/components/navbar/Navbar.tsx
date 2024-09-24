import React, { ReactElement } from "react";
import "./Navbar.css";
import { Sheet } from "@mui/joy";

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

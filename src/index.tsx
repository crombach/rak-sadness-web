import React from "react";
import { createRoot } from "react-dom/client";
import RakSadness from "./components/RakSadness";
import "@fontsource-variable/inter";
import { ToastContextProvider } from "./context/ToastContext";
import Toaster from "./components/toaster/Toaster";
import "./index.scss";

const container = document.getElementById("root");
if (!container) {
  throw new Error("index.html is missing the #root element");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ToastContextProvider>
      <RakSadness />
      <Toaster />
    </ToastContextProvider>
  </React.StrictMode>,
);

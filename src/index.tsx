import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "@fontsource-variable/oxanium";
// IBM Plex Mono ships one file per weight rather than one variable file, so only the
// three the app sets anything in are asked for: the tables and the pick chips at 400,
// the spread and a player's standing at 600, and a game's own mark at 700.
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/dseg14-classic/700.css";
import "@fontsource/dseg7-classic/700.css";
import { AppDataContextProvider } from "./context/AppDataContext";
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
    <BrowserRouter>
      <ToastContextProvider>
        <AppDataContextProvider>
          <App />
        </AppDataContextProvider>
        <Toaster />
      </ToastContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

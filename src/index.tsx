import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
// Chakra Petch ships one file per weight rather than one variable file, so only the
// four the app sets anything in are asked for: body copy at 400, a toast's message at
// 500, a button and a team's name at 600, and every screen-printed label at 700.
//
// The latin cut of each rather than the whole family, which also carries Thai and
// Vietnamese. Those two are small enough that Vite inlines them into the stylesheet,
// so asking for them costs every reader 17kB of base64 for scripts the app has no
// copy in.
import "@fontsource/chakra-petch/latin-400.css";
import "@fontsource/chakra-petch/latin-500.css";
import "@fontsource/chakra-petch/latin-600.css";
import "@fontsource/chakra-petch/latin-700.css";
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

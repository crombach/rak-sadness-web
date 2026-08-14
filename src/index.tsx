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
import chakraPetch400Url from "@fontsource/chakra-petch/files/chakra-petch-latin-400-normal.woff2?url";
import chakraPetch500Url from "@fontsource/chakra-petch/files/chakra-petch-latin-500-normal.woff2?url";
import chakraPetch600Url from "@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2?url";
import chakraPetch700Url from "@fontsource/chakra-petch/files/chakra-petch-latin-700-normal.woff2?url";
import ibmPlexMono400Url from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url";
import ibmPlexMono600Url from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2?url";
import ibmPlexMono700Url from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2?url";
import dseg14Url from "@fontsource/dseg14-classic/files/dseg14-classic-latin-700-normal.woff2?url";
import dseg7Url from "@fontsource/dseg7-classic/files/dseg7-classic-latin-700-normal.woff2?url";
import { AppDataContextProvider } from "./context/AppDataContext";
import { ToastContextProvider } from "./context/ToastContext";
import Toaster from "./components/toaster/Toaster";
import prefetchLink from "./utils/prefetchLink";
import "./index.scss";

// @font-face only fetches a file once layout needs it, which for the segment
// faces is after their ghost has already committed to a fallback width. Most of
// these weights are not what the route on screen first paints in, so this asks
// the browser to warm them rather than to `preload` them.
const PREFETCH_FONT_URLS = [
  chakraPetch400Url,
  chakraPetch500Url,
  chakraPetch600Url,
  chakraPetch700Url,
  ibmPlexMono400Url,
  ibmPlexMono600Url,
  ibmPlexMono700Url,
  dseg14Url,
  dseg7Url,
];
for (const href of PREFETCH_FONT_URLS) {
  prefetchLink(href, {
    as: "font",
    type: "font/woff2",
    crossorigin: "anonymous",
  });
}

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

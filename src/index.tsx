import React from "react";
import { createRoot } from "react-dom/client";
import RakSadness from "./components/RakSadness";
import "@fontsource-variable/inter";
import { CssVarsProvider, CssBaseline } from "@mui/joy";
import { ToastContextProvider } from "./context/ToastContext";
import Toaster from "./components/toaster/Toaster";
import "./index.scss";
import theme from "./theme";

const container = document.getElementById("root");
if (!container) {
  throw new Error("index.html is missing the #root element");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <CssVarsProvider disableNestedContext theme={theme}>
      <ToastContextProvider>
        <CssBaseline />
        <RakSadness />
        <Toaster />
      </ToastContextProvider>
    </CssVarsProvider>
  </React.StrictMode>,
);

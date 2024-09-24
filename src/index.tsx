import React from "react";
import { createRoot } from "react-dom/client";
import RakSadness from "./components/RakSadness";
import "@fontsource-variable/inter";
import { CssVarsProvider, CssBaseline } from "@mui/joy";
import { ToastContextProvider } from "./context/ToastContext";
import Toaster from "./components/toaster/Toaster";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CssVarsProvider disableNestedContext defaultMode="system">
      <ToastContextProvider>
        <CssBaseline />
        <RakSadness />
        <Toaster />
      </ToastContextProvider>
    </CssVarsProvider>
  </React.StrictMode>,
);

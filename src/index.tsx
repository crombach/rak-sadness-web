import React from "react";
import { createRoot } from "react-dom/client";
import RakSadness from "./components/RakSadness";
import "@fontsource-variable/inter";
import { CssVarsProvider, CssBaseline } from "@mui/joy";
import { ToastContextProvider } from "./context/ToastContext";
import Toaster from "./components/toaster/Toaster";
import "./index.scss";
import theme from "./theme";

const root = createRoot(document.getElementById("root"));
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

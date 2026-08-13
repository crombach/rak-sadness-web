import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "@fontsource-variable/inter";
import "@fontsource/dseg14-classic/700.css";
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

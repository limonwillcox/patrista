import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AppProvider } from "./context/AppContext";
import { applyFont, applyTheme, storedFont, storedTheme } from "./lib/prefs";
import "./styles.css";
import "./styles/connections.css";

applyTheme(storedTheme());
applyFont(storedFont());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);

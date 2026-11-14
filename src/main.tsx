import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App, preloadPage, warmPages } from "./App";
import { AppProvider } from "./context/AppContext";
import { applyFont, applyTheme, storedFont, storedTheme } from "./lib/prefs";
import "./styles/fonts.css";
import "./styles.css";
import "./styles/connections.css";

applyTheme(storedTheme());
applyFont(storedFont());

// The page being opened has a file of its own (src/App.tsx). Its ready-made HTML is already on screen;
// fetch that file first so React draws the whole page at once.
void preloadPage(window.location.pathname).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </StrictMode>
  );
  warmPages();
});

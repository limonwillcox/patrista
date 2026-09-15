import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCatalog } from "../api/client";
import {
  applyFont,
  applyReadOptionClasses,
  applyTheme,
  setStoredFont,
  setStoredMode,
  setStoredOpt,
  setStoredParallel,
  setStoredTheme,
  setStoredUser,
  setStoredVersion,
  storedFont,
  storedMode,
  storedOpt,
  storedParallel,
  storedTheme,
  storedUser,
  storedVersion,
  storedRailAutoFocus,
  setStoredRailAutoFocus,
  storedRailAutoCollapse,
  setStoredRailAutoCollapse,
  type LangMode,
  type ReadOptId,
  type Theme
} from "../lib/prefs";
import type { Catalog, Passage } from "../../server/types";

type ReadOpts = Record<ReadOptId, boolean>;

type AppState = {
  catalog: Catalog | null;
  catalogError: string | null;
  mode: LangMode;
  version: string;
  theme: Theme;
  font: number;
  parallel: boolean;
  opts: ReadOpts;
  user: string | null;
  navOpen: boolean;
  booklistOpen: boolean;
  loginOpen: boolean;
  loginTab: "signin" | "create";
  toast: string | null;
  activePassage: Passage | null;
  railAutoFocus: boolean;
  railAutoCollapse: boolean;
  setMode: (mode: LangMode) => void;
  setVersion: (id: string) => void;
  setTheme: (theme: Theme) => void;
  setFont: (n: number) => void;
  setParallel: (on: boolean) => void;
  toggleOpt: (id: ReadOptId) => void;
  setRailAutoFocus: (on: boolean) => void;
  setRailAutoCollapse: (on: boolean) => void;
  setUser: (name: string | null) => void;
  setNavOpen: (open: boolean) => void;
  setBooklistOpen: (open: boolean) => void;
  setLoginOpen: (open: boolean, tab?: "signin" | "create") => void;
  setLoginTab: (tab: "signin" | "create") => void;
  showToast: (msg: string) => void;
  setActivePassage: (p: Passage | null) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [mode, setModeState] = useState<LangMode>(() => (typeof localStorage === "undefined" ? "translation" : storedMode()));
  const [version, setVersionState] = useState(() => (typeof localStorage === "undefined" ? "" : storedVersion()));
  const [theme, setThemeState] = useState<Theme>(() => (typeof localStorage === "undefined" ? "day" : storedTheme()));
  const [font, setFontState] = useState(() => (typeof localStorage === "undefined" ? 18 : storedFont()));
  const [parallel, setParallelState] = useState(() => (typeof localStorage === "undefined" ? false : storedParallel()));
  const [opts, setOpts] = useState<ReadOpts>(() => ({
    nums: typeof localStorage === "undefined" ? true : storedOpt("nums"),
    head: typeof localStorage === "undefined" ? true : storedOpt("head"),
    fn: typeof localStorage === "undefined" ? false : storedOpt("fn")
  }));
  const [user, setUserState] = useState<string | null>(() => (typeof localStorage === "undefined" ? null : storedUser()));
  const [navOpen, setNavOpen] = useState(false);
  const [booklistOpen, setBooklistOpen] = useState(false);
  const [loginOpen, setLoginOpenState] = useState(false);
  const [loginTab, setLoginTab] = useState<"signin" | "create">("signin");
  const [toast, setToast] = useState<string | null>(null);
  const [activePassage, setActivePassage] = useState<Passage | null>(null);
  const [railAutoFocus, setRailAutoFocusState] = useState(() =>
    typeof localStorage === "undefined" ? true : storedRailAutoFocus()
  );
  const [railAutoCollapse, setRailAutoCollapseState] = useState(() =>
    typeof localStorage === "undefined" ? true : storedRailAutoCollapse()
  );

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((err: unknown) => setCatalogError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  useEffect(() => {
    applyReadOptionClasses(opts);
  }, [opts]);

  const value = useMemo<AppState>(
    () => ({
      catalog,
      catalogError,
      mode,
      version,
      theme,
      font,
      parallel,
      opts,
      user,
      navOpen,
      booklistOpen,
      loginOpen,
      loginTab,
      toast,
      activePassage,
      railAutoFocus,
      railAutoCollapse,
      setRailAutoFocus: (on) => {
        setStoredRailAutoFocus(on);
        setRailAutoFocusState(on);
      },
      setRailAutoCollapse: (on) => {
        setStoredRailAutoCollapse(on);
        setRailAutoCollapseState(on);
      },
      setMode: (next) => {
        setStoredMode(next);
        setModeState(next);
      },
      setVersion: (id) => {
        setStoredVersion(id);
        setVersionState(id);
      },
      setTheme: (next) => {
        setStoredTheme(next);
        setThemeState(next);
      },
      setFont: (n) => {
        setStoredFont(n);
        setFontState(n);
      },
      setParallel: (on) => {
        setStoredParallel(on);
        setParallelState(on);
      },
      toggleOpt: (id) => {
        setOpts((prev) => {
          const next = { ...prev, [id]: !prev[id] };
          setStoredOpt(id, next[id]);
          return next;
        });
      },
      setUser: (name) => {
        setStoredUser(name);
        setUserState(name);
      },
      setNavOpen,
      setBooklistOpen,
      setLoginOpen: (open, tab) => {
        if (tab) setLoginTab(tab);
        setLoginOpenState(open);
      },
      setLoginTab,
      showToast: (msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2200);
      },
      setActivePassage
    }),
    [catalog, catalogError, mode, version, theme, font, parallel, opts, user, navOpen, booklistOpen, loginOpen, loginTab, toast, activePassage, railAutoFocus, railAutoCollapse]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

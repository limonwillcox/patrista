import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { parseQuery } from "../../server/query";
import { exactAuthorId } from "../lib/catalogPreview";
import { FATHERS_INDEX_PATH } from "../lib/fatherPageMeta";
import { siteTab, type SiteTab } from "../lib/homeNav";
import { useReadTabHref } from "../lib/useReadTabHref";
import { bibleHref } from "../lib/lastRead";
import { useApp } from "../context/AppContext";
import { Booklist } from "./Booklist";
import { AccountLink, SignInDialog, SignInNudge } from "./SignIn";

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Patrista">
      <img className="logo" src="/assets/patrista-logo-102.webp" alt="" width={34} height={34} />
      <span className="brand-name">Patrista</span>
    </Link>
  );
}

/**
 * The site's three places. Fathers: the library by century, with what happened in each century.
 * Study: the Fathers' writings, reopened at the last one read. Bible: Scripture with the Fathers'
 * commentary beside it, reopened at the last chapter read.
 */
function SiteTabs({ tab }: { tab: SiteTab | null }) {
  const studyHref = useReadTabHref();
  const item = (id: SiteTab, href: string, label: string) => (
    <Link to={href} className={"site-tab" + (tab === id ? " is-on" : "")} aria-current={tab === id ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <nav className="site-tabs" aria-label="Primary">
      {item("fathers", FATHERS_INDEX_PATH, "Fathers")}
      {item("study", studyHref, "Study")}
      {item("bible", bibleHref(), "Bible")}
      {item("types", "/types", "Types")}
    </nav>
  );
}

const SearchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

/** The ⋯ menu: the pages and settings that do not need a tab of their own. */
function SiteMenu() {
  const { theme, setTheme, font, setFont } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const night = theme === "night";
  return (
    <div className="site-menu" ref={ref}>
      <button
        type="button"
        className={"icon-btn site-menu-btn" + (open ? " active" : "")}
        aria-label="More"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open ? (
        <div className="site-menu-panel">
          <Link className="site-menu-item" to="/about">
            About Patrista
          </Link>
          <Link className="site-menu-item" to="/fixes">
            Feedback
          </Link>
          <AccountLink kind="menu" />
          <div className="site-menu-sep" role="separator" />
          <div className="site-menu-row">
            <span>Text size</span>
            <span className="site-menu-steps">
              <button type="button" aria-label="Decrease text size" onClick={() => setFont(Math.max(14, font - 2))}>
                A−
              </button>
              <button type="button" aria-label="Increase text size" onClick={() => setFont(Math.min(26, font + 2))}>
                A+
              </button>
            </span>
          </div>
          <button
            type="button"
            className="site-menu-row site-menu-toggle"
            role="switch"
            aria-checked={night}
            onClick={() => setTheme(night ? "day" : "night")}
          >
            <span>Night mode</span>
            <span className={"site-switch" + (night ? " is-on" : "")} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Desktop: the same pages and settings as the ⋯ menu, laid out on the right of the header so it
 * balances the logo and tabs on the left.
 */
function HeaderTools() {
  const { theme, setTheme, font, setFont } = useApp();
  const night = theme === "night";
  return (
    <div className="header-tools">
      <Link className="header-link" to="/about">
        About
      </Link>
      <Link className="header-link" to="/fixes">
        Feedback
      </Link>
      <AccountLink kind="header" />
      <span className="header-sep" aria-hidden="true" />
      <div className="header-size" role="group" aria-label="Text size">
        <button type="button" id="fontDown" aria-label="Decrease text size" onClick={() => setFont(Math.max(14, font - 2))}>
          A
        </button>
        <button type="button" id="fontUp" aria-label="Increase text size" onClick={() => setFont(Math.min(26, font + 2))}>
          A
        </button>
      </div>
      <button
        type="button"
        className="icon-btn header-theme"
        id="themeBtn"
        aria-label={night ? "Day mode" : "Night mode"}
        aria-pressed={night}
        title={night ? "Day mode" : "Night mode"}
        onClick={() => setTheme(night ? "day" : "night")}
      >
        {night ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}

/**
 * Search, with the list of every writing as its dropdown: typing filters the list, the Writings
 * button opens it without typing. On phones the field folds into an icon and opens over the header.
 */
function SiteSearch({
  searchQ,
  setSearchQ,
  open,
  setOpen
}: {
  searchQ: string;
  setSearchQ: (q: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { catalog, booklistOpen, setBooklistOpen } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urlQ = params.get("q");
    if (urlQ != null) setSearchQ(urlQ);
  }, [params, setSearchQ]);

  // A click anywhere outside the search closes its dropdown.
  useEffect(() => {
    if (!booklistOpen) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setBooklistOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [booklistOpen, setBooklistOpen]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = searchQ.trim();
    if (!trimmed || !catalog) return;
    setBooklistOpen(false);
    setOpen(false);
    const authorId = exactAuthorId(trimmed, catalog);
    if (authorId) {
      navigate("/fathers/" + encodeURIComponent(authorId) + "/");
      return;
    }
    const parsed = parseQuery(trimmed, catalog);
    if (parsed.type === "ref") {
      const ch = parsed.chapter;
      navigate(
        "/read?work=" + encodeURIComponent(parsed.work) + (ch != null ? "&chapter=" + ch : "") + (ch != null ? "#ch-" + ch : "")
      );
      return;
    }
    navigate("/search?q=" + encodeURIComponent(trimmed));
  }

  // Typing no longer opens the Writings list: Enter goes to the search page. The list still filters
  // as you type once the Writings button has opened it.
  function onQueryInput(value: string) {
    setSearchQ(value);
  }

  return (
    <div className="site-search" ref={wrapRef}>
      <form className="header-search" id="searchForm" role="search" onSubmit={onSubmit}>
        <span className="header-search-icon">{SearchIcon}</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          id="q"
          placeholder="Search the Fathers…"
          value={searchQ}
          aria-label="Search writings"
          autoComplete="off"
          onChange={(e) => onQueryInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setBooklistOpen(false);
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          className={"header-search-browse" + (booklistOpen ? " is-open" : "")}
          id="booklistBtn"
          aria-expanded={booklistOpen}
          aria-controls="booklist"
          onClick={() => setBooklistOpen(!booklistOpen)}
        >
          Writings <span aria-hidden="true">▾</span>
        </button>
      </form>
      <button type="button" className="icon-btn header-search-close" aria-label="Close search" onClick={() => setOpen(false)}>
        ×
      </button>
      <Booklist query={searchQ} onQueryChange={setSearchQ} />
    </div>
  );
}

function Header({ searchQ, setSearchQ, tab }: { searchQ: string; setSearchQ: (q: string) => void; tab: SiteTab | null }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => setSearchOpen(false), [location.pathname, location.search]);

  return (
    <header className={"site-header" + (searchOpen ? " is-searching" : "")}>
      <div className="header-left">
        <Brand />
        <SiteTabs tab={tab} />
      </div>
      <SiteSearch searchQ={searchQ} setSearchQ={setSearchQ} open={searchOpen} setOpen={setSearchOpen} />
      <div className="header-actions">
        <button type="button" className="icon-btn header-search-open" aria-label="Search" onClick={() => setSearchOpen(true)}>
          {SearchIcon}
        </button>
        <HeaderTools />
        <SiteMenu />
      </div>
    </header>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { setBooklistOpen, setLoginOpen, toast } = useApp();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const tab = siteTab(location.pathname);
  const isHistoryCinematic = location.pathname === "/church-history" || location.pathname === "/church-history/";
  const isJournal = location.pathname === "/journal";

  useEffect(() => {
    setBooklistOpen(false);
  }, [location.pathname, location.search, setBooklistOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLoginOpen(false);
        setBooklistOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setLoginOpen, setBooklistOpen]);

  return (
    <>
      <a className="skip-link" href="#page">
        Skip to content
      </a>
      <Header searchQ={searchQ} setSearchQ={setSearchQ} tab={tab} />
      <main
        className={"page" + (isHistoryCinematic ? " page--history-cinematic" : "") + (isJournal ? " page--journal" : "")}
        id="page"
      >
        {children}
      </main>
      <SignInNudge />
      <SignInDialog />
      <div className={"toast" + (toast ? " open" : "")} id="toast">
        {toast}
      </div>
    </>
  );
}

export function readHref(work: string, chapter?: number | null): string {
  let u = "/read?work=" + encodeURIComponent(work);
  if (chapter != null) u += "&chapter=" + encodeURIComponent(String(chapter));
  return u;
}

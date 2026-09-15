import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { parseQuery } from "../../server/query";
import { useApp } from "../context/AppContext";
import { ICONS } from "./Icons";

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Patrista">
      <img className="logo" src="/assets/patrista-logo.jpg" alt="" width={34} height={34} />
      <span className="brand-name">Patrista</span>
    </Link>
  );
}

function Rail() {
  const { navOpen, setNavOpen } = useApp();
  const location = useLocation();
  const readActive = location.pathname === "/read";
  const bibleActive = location.pathname === "/bible";
  const writingsActive = location.pathname === "/church-fathers" || location.pathname === "/browse";
  const timelineActive = location.pathname.startsWith("/church-history/timeline");
  return (
    <nav className={"rail" + (navOpen ? " open" : "")} id="rail" aria-label="Primary">
      <div className="rail-pages">
        <NavLink to="/read" className={() => (readActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.read}
          <span>Read</span>
        </NavLink>
        <NavLink to="/bible" className={() => (bibleActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.bible}
          <span>Bible</span>
        </NavLink>
        <NavLink to="/study" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.study}
          <span>Study</span>
        </NavLink>
        <NavLink
          to="/church-fathers"
          className={() => (writingsActive ? "active" : "")}
          onClick={() => setNavOpen(false)}
        >
          {ICONS.browse}
          <span>Browse</span>
        </NavLink>
        <NavLink
          to="/church-history/timeline#nativity"
          className={() => (timelineActive ? "active" : "")}
          onClick={() => setNavOpen(false)}
        >
          {ICONS.timeline}
          <span>Timeline</span>
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.about}
          <span>About</span>
        </NavLink>
        <NavLink to="/give" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.give}
          <span>Give</span>
        </NavLink>
      </div>
    </nav>
  );
}

function Header() {
  const {
    user,
    theme,
    setTheme,
    setNavOpen,
    setUser,
    navOpen,
    catalog,
    font,
    setFont,
    booklistOpen,
    setBooklistOpen
  } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = catalog ? parseQuery(q, catalog) : { type: "keyword" as const, q };
    if (parsed.type === "ref") {
      const ch = parsed.chapter;
      navigate(
        "/read?work=" + encodeURIComponent(parsed.work) + (ch != null ? "&chapter=" + ch : "") + (ch != null ? "#ch-" + ch : "")
      );
      return;
    }
    navigate("/search?q=" + encodeURIComponent(q));
  }

  return (
    <header className="site-header">
      <button
        className="icon-btn hamburger"
        id="hamburger"
        aria-label="Open menu"
        onClick={() => setNavOpen(!navOpen)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Brand />
      <form className="header-search" id="searchForm" onSubmit={onSubmit}>
        <button
          type="button"
          className={"writings-toggle" + (booklistOpen ? " active" : "")}
          id="booklistBtn"
          aria-pressed={booklistOpen}
          onClick={() => setBooklistOpen(!booklistOpen)}
        >
          Writings
        </button>
        <input
          type="search"
          name="q"
          id="q"
          placeholder="Find across the Fathers…"
          value={q}
          aria-label="Search writings"
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <div className="header-actions">
        <div className="font-ctrl">
          Aa{" "}
          <button type="button" id="fontDown" aria-label="Decrease text size" onClick={() => setFont(Math.max(14, font - 2))}>
            −
          </button>
          <button type="button" id="fontUp" aria-label="Increase text size" onClick={() => setFont(Math.min(26, font + 2))}>
            +
          </button>
        </div>
        <button
          className="icon-btn"
          id="themeBtn"
          title="Night mode"
          aria-label="Toggle night mode"
          onClick={() => setTheme(theme === "night" ? "day" : "night")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
          </svg>
        </button>
        {location.pathname === "/bible" ? <RailSettings /> : null}
        {user ? (
          <>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{user}</span>
            <button className="linkish" id="signOut" onClick={() => setUser(null)}>
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

function RailSettings() {
  const { railAutoFocus, railAutoCollapse, setRailAutoFocus, setRailAutoCollapse } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div className="rail-settings-wrap" ref={ref}>
      <button
        type="button"
        className={"icon-btn" + (open ? " active" : "")}
        id="railSettingsBtn"
        title="Commentary scroll settings"
        aria-label="Commentary scroll settings"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open ? (
        <div className="rail-settings-popover" role="dialog" aria-label="Commentary scroll settings">
          <p className="rail-settings-heading">Scroll Rail</p>
          <label className="rail-setting-item">
            <input
              type="checkbox"
              id="pref-rail-autofocus"
              checked={railAutoFocus}
              onChange={(e) => setRailAutoFocus(e.target.checked)}
            />
            <span>Auto-focus active section</span>
          </label>
          <label className="rail-setting-item">
            <input
              type="checkbox"
              id="pref-rail-autocollapse"
              checked={railAutoCollapse}
              onChange={(e) => setRailAutoCollapse(e.target.checked)}
            />
            <span>Auto-collapse rail on section change</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}

function Booklist() {
  const { catalog, booklistOpen, setBooklistOpen } = useApp();
  const [authorId, setAuthorId] = useState("augustine");
  if (!catalog || !booklistOpen) {
    return <div className="booklist" id="booklist" hidden />;
  }
  const author = catalog.authors.find((a) => a.id === authorId) || catalog.authors[0];
  const works = author ? catalog.works.filter((w) => w.author === author.id) : [];
  return (
    <div className="booklist open" id="booklist">
      <div className="booklist-eras">
        {catalog.eras.map((era) => (
          <div key={era.id}>
            <div className="era-label">{era.label}</div>
            {catalog.authors
              .filter((a) => a.era === era.id)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  data-author={a.id}
                  className={a.id === author?.id ? "active" : ""}
                  onClick={() => setAuthorId(a.id)}
                >
                  {a.name}
                </button>
              ))}
          </div>
        ))}
      </div>
      <div className="booklist-works" id="booklistWorks">
        {author ? (
          <>
            <h3>{author.name}</h3>
            <div className="meta">
              {author.dates} · {author.region}
            </div>
            {works.map((w) => (
              <div key={w.id}>
                <Link className="work-link" to={"/read?work=" + w.id} onClick={() => setBooklistOpen(false)}>
                  <strong>{w.title}</strong>{" "}
                  <span className="meta">
                    ({w.short} · {w.series})
                  </span>
                </Link>
                <div className="chapters">
                  {Array.from({ length: w.chapters }, (_, i) => i + 1).map((n) => (
                    <Link key={n} to={"/read?work=" + w.id + "&chapter=" + n + "#ch-" + n} onClick={() => setBooklistOpen(false)}>
                      {n}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

function AuthModal() {
  const { loginOpen, loginTab, setLoginOpen, setLoginTab, setUser, showToast } = useApp();
  const [signinEmail, setSigninEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  if (!loginOpen) {
    return (
      <div className="modal-back" id="loginModal">
        <div className="modal" role="dialog" aria-labelledby="loginTitle" />
      </div>
    );
  }
  return (
    <div
      className="modal-back open"
      id="loginModal"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "loginModal") setLoginOpen(false);
      }}
    >
      <div className="modal" role="dialog" aria-labelledby="loginTitle">
        <h2 id="loginTitle">{loginTab === "create" ? "Create account" : "Sign in"}</h2>
        <div className="auth-tabs">
          <button type="button" className={loginTab === "signin" ? "active" : ""} data-auth="signin" onClick={() => setLoginTab("signin")}>
            Sign in
          </button>
          <button type="button" className={loginTab === "create" ? "active" : ""} data-auth="create" onClick={() => setLoginTab("create")}>
            Create account
          </button>
        </div>
        {loginTab === "signin" ? (
          <div className="auth-panel active" id="panel-signin">
            <label>Email</label>
            <input id="signinEmail" type="email" placeholder="you@example.org" value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} />
            <label>Password</label>
            <input id="signinPass" type="password" placeholder="Password" />
            <button
              className="btn-burgundy"
              id="signinSubmit"
              style={{ width: "100%" }}
              onClick={() => {
                const email = signinEmail.trim();
                setUser(email ? email.split("@")[0] : "Reader");
                setLoginOpen(false);
              }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="auth-panel active" id="panel-create">
            <label>Display name</label>
            <input id="loginName" placeholder="e.g. Paula of Bethlehem" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            <label>Email</label>
            <input id="loginEmail" type="email" placeholder="you@example.org" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            <label>Password</label>
            <input id="loginPass" type="password" placeholder="Create a password" />
            <button
              className="btn-burgundy"
              id="loginSubmit"
              style={{ width: "100%" }}
              onClick={() => {
                const name = (createName || createEmail || "Reader").trim();
                setUser(name.includes("@") ? name.split("@")[0] : name);
                setLoginOpen(false);
              }}
            >
              Create account
            </button>
          </div>
        )}
        <div className="oauth-block">
          <p className="fineprint" style={{ marginTop: 0 }}>
            OAuth is optional and not required. It is not connected in this mock.
          </p>
          <button type="button" className="btn-oauth" data-oauth="google" onClick={() => showToast("OAuth is optional and not connected in this mock.")}>
            Continue with Google
          </button>
          <button type="button" className="btn-oauth" data-oauth="microsoft" onClick={() => showToast("OAuth is optional and not connected in this mock.")}>
            Continue with Microsoft
          </button>
        </div>
        <p style={{ textAlign: "center", margin: "12px 0 0" }}>
          <button className="linkish" id="loginCancel" onClick={() => setLoginOpen(false)}>
            Cancel
          </button>
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { setNavOpen, setBooklistOpen, setLoginOpen, toast, navOpen } = useApp();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isHistoryCinematic = location.pathname === "/church-history" || location.pathname === "/church-history/";
  const isFathers = location.pathname === "/church-fathers" || location.pathname === "/browse";

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
    setBooklistOpen(false);
  }, [location.pathname, location.search, setNavOpen, setBooklistOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLoginOpen(false);
        setBooklistOpen(false);
        setNavOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (!navOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest("#rail") || t.closest("#hamburger") || t.closest(".landing-menu")) return;
      setNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [navOpen, setLoginOpen, setBooklistOpen, setNavOpen]);

  return (
    <>
      <a className="skip-link" href="#page">
        Skip to content
      </a>
      <Rail />
      {!isLanding ? <Header /> : null}
      <Booklist />
      <main
        className={
          "page" +
          (isLanding ? " page--landing" : "") +
          (isHistoryCinematic ? " page--history-cinematic" : "") +
          (isFathers ? " page--library" : "")
        }
        id="page"
      >
        {children}
      </main>
      <AuthModal />
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

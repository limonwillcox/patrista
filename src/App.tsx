import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from "react-router-dom";
import { staticWorkId } from "./lib/workSlugs";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FathersPage } from "./pages/FathersPage";

/*
 * Each page but the Fathers page (the front door) is a file of its own, fetched when it is first opened,
 * so a reader arriving on one page does not download the others. `page()` keeps the loader beside the
 * component so the first page's file can be fetched before React draws (preloadPage, used in main.tsx).
 */
type Loader = () => Promise<unknown>;
function page(load: () => Promise<ComponentType>): { Page: ComponentType; load: Loader } {
  let once: Promise<{ default: ComponentType }> | null = null;
  const get = () => (once ??= load().then((c) => ({ default: c })));
  return { Page: lazy(get), load: get };
}

const read = page(() => import("./pages/ReadPage").then((m) => m.ReadPage));
const print = page(() => import("./pages/PrintPage").then((m) => m.PrintPage));
const bible = page(() => import("./pages/BiblePage").then((m) => m.BiblePage));
const search = page(() => import("./pages/SearchPage").then((m) => m.SearchPage));
const journal = page(() => import("./pages/JournalPage").then((m) => m.JournalPage));
const history = page(() => import("./pages/ChurchHistoryPage").then((m) => m.ChurchHistoryPage));
const study = page(() => import("./pages/StudyPage").then((m) => m.StudyPage));
const types = page(() => import("./pages/TypesPage").then((m) => m.TypesPage));
const embedTypes = page(() => import("./pages/EmbedTypesPage").then((m) => m.EmbedTypesPage));
const tabernacle = page(() => import("./pages/TabernaclePage").then((m) => m.TabernaclePage));
const about = page(() => import("./pages/AboutPage").then((m) => m.AboutPage));
const privacy = page(() => import("./pages/PrivacyPage").then((m) => m.PrivacyPage));
const give = page(() => import("./pages/GivePage").then((m) => m.GivePage));
const fixes = page(() => import("./pages/FixesPage").then((m) => m.FixesPage));

const BY_NAME: Record<string, Loader> = {
  read: read.load,
  "augustines-confessions": read.load,
  print: print.load,
  bible: bible.load,
  search: search.load,
  journal: journal.load,
  study: study.load,
  types: types.load,
  tabernacle: tabernacle.load,
  about: about.load,
  privacy: privacy.load,
  give: give.load,
  fixes: fixes.load
};

/** The file for the page at this address, if it has one of its own. Mirrors the routes below. */
function loaderFor(pathname: string): Loader | null {
  if (staticWorkId(pathname)) return read.load;
  const parts = pathname.replace(/\/+$/, "").split("/").slice(1);
  if (parts[0] === "embed") return embedTypes.load;
  if (parts[0] === "fathers") return parts.length === 4 ? read.load : null;
  if (parts[0] === "church-history") return parts.length === 1 ? history.load : null;
  return parts.length === 1 ? (BY_NAME[parts[0]] ?? null) : null;
}

/**
 * Fetch the file of the page being opened. The page's ready-made HTML stays on screen until React
 * draws, so waiting for this first means React draws the page itself, not an empty frame.
 */
export function preloadPage(pathname: string): Promise<unknown> {
  const load = loaderFor(pathname);
  return load ? load().catch(() => undefined) : Promise.resolve();
}

export function App() {
  const { pathname } = useLocation();
  // A diagram framed on another site: no header, nothing but the diagram.
  if (pathname.startsWith("/embed/")) {
    return (
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/embed/types" element={<embedTypes.Page />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<FathersPage />} />
            <Route path="/read" element={<read.Page />} />
            <Route path="/print" element={<print.Page />} />
            <Route path="/augustines-confessions" element={<read.Page />} />
            <Route path="/fathers" element={<FathersPage />} />
            <Route path="/fathers/:authorId" element={<FathersPage />} />
            <Route path="/fathers/:authorId/:workId/:chapterSlug" element={<read.Page />} />
            <Route path="/bible" element={<bible.Page />} />
            <Route path="/search" element={<search.Page />} />
            <Route path="/journal" element={<journal.Page />} />
            <Route path="/church-fathers" element={<LibraryRedirect />} />
            <Route path="/browse" element={<LibraryRedirect />} />
            <Route path="/church-history" element={<history.Page />} />
            <Route path="/church-history/timeline" element={<TimelineRedirect />} />
            <Route path="/study" element={<study.Page />} />
            <Route path="/types" element={<types.Page />} />
            <Route path="/types/:slug" element={<SharedTypeRedirect />} />
            <Route path="/tabernacle" element={<tabernacle.Page />} />
            <Route path="/about" element={<about.Page />} />
            <Route path="/privacy" element={<privacy.Page />} />
            <Route path="/give" element={<give.Page />} />
            <Route path="/fixes" element={<fixes.Page />} />
            <Route path="*" element={<CatchAll />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

/** A shared type's own page (/types/<slug>/, with its picture for link previews) opens that type on the map. */
function SharedTypeRedirect() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set("type", slug || "");
  return <Navigate to={"/types?" + next.toString()} replace />;
}

/** The timeline is now part of the Fathers page: each event sits in its century, under the same id. */
function TimelineRedirect() {
  const { hash } = useLocation();
  return <Navigate to={"/fathers/" + hash} replace />;
}

/** The old shelf page is now each Father's bookcase on /fathers/. */
function LibraryRedirect() {
  const [params] = useSearchParams();
  const author = params.get("author");
  return <Navigate to={author ? "/fathers/" + encodeURIComponent(author) + "/" : "/fathers/"} replace />;
}

/** Static work URLs (/fathers/<author>/<work>.html) are the reader for that work; anything else goes home. */
function CatchAll() {
  const location = useLocation();
  if (staticWorkId(location.pathname)) return <read.Page />;
  return <Navigate to="/" replace />;
}

/** Once the first page is up and the browser is idle, fetch the pages most often opened next. */
export function warmPages(): void {
  const go = () => [read, bible, types, search].forEach((p) => void p.load().catch(() => undefined));
  const idle = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  window.setTimeout(() => (idle ? idle(go, { timeout: 4000 }) : go()), 3000);
}

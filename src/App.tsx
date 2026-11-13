import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from "react-router-dom";
import { staticWorkId } from "./lib/workSlugs";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AboutPage } from "./pages/AboutPage";
import { BiblePage } from "./pages/BiblePage";
import { EmbedTypesPage } from "./pages/EmbedTypesPage";
import { ChurchHistoryPage } from "./pages/ChurchHistoryPage";
import { FathersPage } from "./pages/FathersPage";
import { FixesPage } from "./pages/FixesPage";
import { GivePage } from "./pages/GivePage";
import { JournalPage } from "./pages/JournalPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { PrintPage } from "./pages/PrintPage";
import { ReadPage } from "./pages/ReadPage";
import { SearchPage } from "./pages/SearchPage";
import { StudyPage } from "./pages/StudyPage";
import { TabernaclePage } from "./pages/TabernaclePage";
import { TypesPage } from "./pages/TypesPage";

export function App() {
  const { pathname } = useLocation();
  // A diagram framed on another site: no header, nothing but the diagram.
  if (pathname.startsWith("/embed/")) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/embed/types" element={<EmbedTypesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<FathersPage />} />
          <Route path="/read" element={<ReadPage />} />
          <Route path="/print" element={<PrintPage />} />
          <Route path="/augustines-confessions" element={<ReadPage />} />
          <Route path="/fathers" element={<FathersPage />} />
          <Route path="/fathers/:authorId" element={<FathersPage />} />
          <Route path="/fathers/:authorId/:workId/:chapterSlug" element={<ReadPage />} />
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/church-fathers" element={<LibraryRedirect />} />
          <Route path="/browse" element={<LibraryRedirect />} />
          <Route path="/church-history" element={<ChurchHistoryPage />} />
          <Route path="/church-history/timeline" element={<TimelineRedirect />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/types" element={<TypesPage />} />
          <Route path="/types/:slug" element={<SharedTypeRedirect />} />
          <Route path="/tabernacle" element={<TabernaclePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/give" element={<GivePage />} />
          <Route path="/fixes" element={<FixesPage />} />
          <Route path="*" element={<CatchAll />} />
        </Routes>
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
  if (staticWorkId(location.pathname)) return <ReadPage />;
  return <Navigate to="/" replace />;
}

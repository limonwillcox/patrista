import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { readPathForStaticWork } from "./lib/workSlugs";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AboutPage } from "./pages/AboutPage";
import { BiblePage } from "./pages/BiblePage";
import { BrowsePage } from "./pages/BrowsePage";
import { ChurchHistoryPage } from "./pages/ChurchHistoryPage";
import { FathersPage } from "./pages/FathersPage";
import { FixesPage } from "./pages/FixesPage";
import { GivePage } from "./pages/GivePage";
import { HomePage } from "./pages/HomePage";
import { JournalPage } from "./pages/JournalPage";
import { ReadPage } from "./pages/ReadPage";
import { SearchPage } from "./pages/SearchPage";
import { StudyPage } from "./pages/StudyPage";
import { TimelinePage } from "./pages/TimelinePage";

export function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/read" element={<ReadPage />} />
          <Route path="/augustines-confessions" element={<ReadPage />} />
          <Route path="/fathers" element={<FathersPage />} />
          <Route path="/fathers/:authorId" element={<FathersPage />} />
          <Route path="/fathers/:authorId/:workId/:chapterSlug" element={<ReadPage />} />
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/church-fathers" element={<BrowsePage />} />
          <Route path="/browse" element={<Navigate to="/church-fathers" replace />} />
          <Route path="/church-history" element={<ChurchHistoryPage />} />
          <Route path="/church-history/timeline" element={<TimelinePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/give" element={<GivePage />} />
          <Route path="/fixes" element={<FixesPage />} />
          <Route path="*" element={<CatchAll />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

/** Old static work links (/fathers/<author>/<work>.html) open the reader; anything else goes home. */
function CatchAll() {
  const location = useLocation();
  return <Navigate to={readPathForStaticWork(location.pathname) || "/"} replace />;
}

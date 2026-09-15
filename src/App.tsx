import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AboutPage } from "./pages/AboutPage";
import { BiblePage } from "./pages/BiblePage";
import { BrowsePage } from "./pages/BrowsePage";
import { ChurchHistoryPage } from "./pages/ChurchHistoryPage";
import { GivePage } from "./pages/GivePage";
import { HomePage } from "./pages/HomePage";
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
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/church-fathers" element={<BrowsePage />} />
          <Route path="/browse" element={<Navigate to="/church-fathers" replace />} />
          <Route path="/church-history" element={<ChurchHistoryPage />} />
          <Route path="/church-history/timeline" element={<TimelinePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/give" element={<GivePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

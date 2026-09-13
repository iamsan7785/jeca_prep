import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from "./components/Layout";
import { useAuth } from "./store/AuthContext";

const LandingPage = lazy(() => import("./pages/AccessPages").then((module) => ({ default: module.LandingPage })));
const AuthPage = lazy(() => import("./pages/AccessPages").then((module) => ({ default: module.AuthPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const MockTestsPage = lazy(() => import("./pages/StudyPages").then((module) => ({ default: module.MockTestsPage })));
const PracticePage = lazy(() => import("./pages/StudyPages").then((module) => ({ default: module.PracticePage })));
const PyqPage = lazy(() => import("./pages/StudyPages").then((module) => ({ default: module.PyqPage })));
const PyqInstructionsPage = lazy(() => import("./pages/PyqInstructionsPage").then((module) => ({ default: module.PyqInstructionsPage })));
const ExamPage = lazy(() => import("./pages/ExamPage").then((module) => ({ default: module.ExamPage })));
const ResultPage = lazy(() => import("./pages/ResultPage").then((module) => ({ default: module.ResultPage })));
const AnalyticsPage = lazy(() => import("./pages/UtilityPages").then((module) => ({ default: module.AnalyticsPage })));
const BookmarksPage = lazy(() => import("./pages/UtilityPages").then((module) => ({ default: module.BookmarksPage })));
const MistakesPage = lazy(() => import("./pages/UtilityPages").then((module) => ({ default: module.MistakesPage })));
const SettingsPage = lazy(() => import("./pages/UtilityPages").then((module) => ({ default: module.SettingsPage })));
const AdminPage = lazy(() => import("./pages/UtilityPages").then((module) => ({ default: module.AdminPage })));
const AdminQuestionsPage = lazy(() => import("./pages/AdminQuestionsPage").then((module) => ({ default: module.AdminQuestionsPage })));

function Protected() { const { isAuthenticated } = useAuth(); const location = useLocation(); return isAuthenticated ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }} />; }
function AdminOnly({ children }: { children: ReactNode }) { const { session } = useAuth(); return session?.user.role === "ADMIN" ? <>{children}</> : <Navigate to="/dashboard" replace />; }
function Fallback() { return <Navigate to="/dashboard" replace />; }

export function App() {
  return <ErrorBoundary><Suspense fallback={<div className="route-loading">Preparing your workspace…</div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Protected />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/mock-tests" element={<MockTestsPage />} />
      <Route path="/mock-tests/:id" element={<ExamPage />} />
      <Route path="/mock-tests/:id/result" element={<ResultPage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/:subject" element={<PracticePage />} />
      <Route path="/pyq" element={<PyqPage />} />
      <Route path="/pyq/instructions/:paperId" element={<PyqInstructionsPage />} />
      <Route path="/pyq/:year" element={<PyqPage />} />
      <Route path="/questions/:id" element={<PracticePage />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/mistakes" element={<MistakesPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/profile" element={<SettingsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
      <Route path="/admin/questions" element={<AdminOnly><AdminQuestionsPage /></AdminOnly>} />
      <Route path="/admin/questions/new" element={<AdminOnly><AdminQuestionsPage /></AdminOnly>} />
      <Route path="/admin/questions/:id/edit" element={<AdminOnly><AdminQuestionsPage /></AdminOnly>} />
      <Route path="/admin/pyq" element={<AdminOnly><AdminQuestionsPage /></AdminOnly>} />
      <Route path="/admin/mock-tests" element={<AdminOnly><AdminQuestionsPage /></AdminOnly>} />
      <Route path="/admin/users" element={<AdminOnly><AdminPage /></AdminOnly>} />
    </Route>
    <Route path="*" element={<Fallback />} />
  </Routes></Suspense></ErrorBoundary>;
}

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppShell } from "./components/layout/app-shell";
import { useAppStore } from "./store/use-app-store";
import type { Role } from "./types/domain";
const ActivityPage = lazy(() => import("./pages/activity-page").then((module) => ({ default: module.ActivityPage })));
const AnalyticsPage = lazy(() => import("./pages/analytics-page").then((module) => ({ default: module.AnalyticsPage })));
const AttendancePage = lazy(() => import("./pages/attendance-page").then((module) => ({ default: module.AttendancePage })));
const DashboardPage = lazy(() => import("./pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const FormsPage = lazy(() => import("./pages/forms-page").then((module) => ({ default: module.FormsPage })));
const GradesPage = lazy(() => import("./pages/grades-page").then((module) => ({ default: module.GradesPage })));
const LearnerProfilePage = lazy(() => import("./pages/learner-profile-page").then((module) => ({ default: module.LearnerProfilePage })));
const LearnersPage = lazy(() => import("./pages/learners-page").then((module) => ({ default: module.LearnersPage })));
const LoginPage = lazy(() => import("./pages/login-page").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("./pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const PromotionPage = lazy(() => import("./pages/promotion-page").then((module) => ({ default: module.PromotionPage })));
const SetupPage = lazy(() => import("./pages/setup-page").then((module) => ({ default: module.SetupPage })));

function RequireAuth() {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const location = useLocation();
  if (!currentUserId) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell />;
}

function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const user = users.find((candidate) => candidate.id === currentUserId);
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 320);
    return () => window.clearTimeout(timer);
  }, []);

  if (booting) {
    return <div className="app-loader" role="status" aria-label="Loading EduNexus"><span /></div>;
  }

  return (
    <Suspense fallback={<div className="route-loader" role="status" aria-label="Loading page"><span /></div>}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
        <Route path="learners" element={<LearnersPage />} />
        <Route path="learners/:id" element={<LearnerProfilePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="grades" element={<RequireRole roles={["school_head", "teacher"]}><GradesPage /></RequireRole>} />
        <Route path="promotion" element={<RequireRole roles={["school_head", "admin_officer"]}><PromotionPage /></RequireRole>} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="setup" element={<RequireRole roles={["school_head"]}><SetupPage /></RequireRole>} />
        <Route path="activity" element={<RequireRole roles={["school_head", "admin_officer"]}><ActivityPage /></RequireRole>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

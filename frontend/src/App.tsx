/**
 * App — root router.
 *
 * Improvements:
 * - All pages are lazy-loaded via React.lazy + Suspense so the initial JS
 *   bundle only includes the landing page. Heavy pages (BudgetPage,
 *   ChecklistPage, etc.) are split into separate chunks and loaded on demand.
 * - Centralised Suspense fallback (full-screen spinner) avoids per-route
 *   boilerplate.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Eagerly loaded — critical path / first paint
import { LandingPage } from './pages/LandingPage';

// Lazy-loaded — only fetched when the user navigates to the route
const DashboardPage   = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PlanEventPage   = lazy(() => import('./pages/PlanEventPage').then(m => ({ default: m.PlanEventPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const EditEventPage   = lazy(() => import('./pages/EditEventPage').then(m => ({ default: m.EditEventPage })));
const BudgetPage      = lazy(() => import('./pages/BudgetPage').then(m => ({ default: m.BudgetPage })));
const ChecklistPage   = lazy(() => import('./pages/ChecklistPage').then(m => ({ default: m.ChecklistPage })));
const IdeasPage       = lazy(() => import('./pages/IdeasPage').then(m => ({ default: m.IdeasPage })));
const SettingsPage    = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                      element={<LandingPage />} />
          <Route path="/dashboard"             element={<DashboardPage />} />
          <Route path="/plan"                  element={<PlanEventPage />} />
          <Route path="/events/:id"            element={<EventDetailPage />} />
          <Route path="/events/:id/edit"       element={<EditEventPage />} />
          <Route path="/budget/:eventId"       element={<BudgetPage />} />
          <Route path="/checklist/:eventId"    element={<ChecklistPage />} />
          <Route path="/ideas"                 element={<IdeasPage />} />
          <Route path="/settings"              element={<SettingsPage />} />
          <Route path="*"                      element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

/**
 * App — root router.
 *
 * Production Code Quality:
 * - ErrorBoundary wraps the entire application preventing unhandled runtime crashes
 * - All secondary pages lazy-loaded via React.lazy + Suspense for optimal FCP
 * - Centralised accessible loading fallback
 */
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eagerly loaded — critical path / first paint
import { LandingPage } from './pages/LandingPage';

// Lazy-loaded — fetched on-demand per route
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
      <LoadingSpinner label="Loading celebration workspace..." size="lg" />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;

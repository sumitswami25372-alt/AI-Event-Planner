import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanEventPage } from './pages/PlanEventPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EditEventPage } from './pages/EditEventPage';
import { BudgetPage } from './pages/BudgetPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { IdeasPage } from './pages/IdeasPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/plan" element={<PlanEventPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EditEventPage />} />
        <Route path="/budget/:eventId" element={<BudgetPage />} />
        <Route path="/checklist/:eventId" element={<ChecklistPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

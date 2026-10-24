import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { EventItem } from '../services/types';
import { formatCurrency } from '../utils/currency';
import { formatDate, daysUntil } from '../utils/date';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAppToast } from '../layouts/AppLayout';

export const DashboardPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion modal state
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useAppToast();

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getEvents();
      setEvents(res.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteEvent(eventToDelete.id);
      showToast(`Event "${eventToDelete.name}" removed successfully`, 'success');
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Calculating celebration statistics from database..." size="lg" />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchEvents} title="Unable to load dashboard" />;
  }

  // Authoritative calculations from real database records
  const totalEvents = events.length;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter((e) => {
    if (!e.event_date) return false;
    const d = new Date(e.event_date);
    return !isNaN(d.getTime()) && d >= now;
  });

  const totalTasks = events.reduce((acc, e) => acc + (e.total_tasks || 0), 0);
  const completedTasks = events.reduce((acc, e) => acc + (e.completed_tasks || 0), 0);
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalCommittedBudget = events.reduce((acc, e) => acc + (e.budget_amount || 0), 0);
  const totalActualSpend = events.reduce((acc, e) => acc + (e.actual_total || 0), 0);
  const budgetUtilization = totalCommittedBudget > 0 ? Math.round((totalActualSpend / totalCommittedBudget) * 100) : 0;

  // Primary currency
  const primaryCurrency = events[0]?.currency || 'INR';

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Celebration Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and planning progress across all your events.
          </p>
        </div>

        <Link
          to="/plan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Plan New Event</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved Events</span>
            <div className="p-2 rounded-xl bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalEvents}</div>
          <p className="text-xs text-slate-500 mt-1">Total active celebrations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Events</span>
            <div className="p-2 rounded-xl bg-gold-100 dark:bg-gold-950/80 text-gold-700 dark:text-gold-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{upcomingEvents.length}</div>
          <p className="text-xs text-slate-500 mt-1">Scheduled for future dates</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Checklist Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {completedTasks} / {totalTasks}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div style={{ width: `${taskCompletionRate}%` }} className="bg-emerald-500 h-full"></div>
            </div>
            <span className="text-xs font-semibold text-emerald-600">{taskCompletionRate}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Budget Allocated</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalActualSpend, primaryCurrency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {budgetUtilization}% of total {formatCurrency(totalCommittedBudget, primaryCurrency)}
          </p>
        </div>
      </div>

      {/* Events List / Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
            Your Celebrations ({events.length})
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-ivory-300 dark:border-slate-800 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-400 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-gold-500" />
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              No celebrations planned yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
              Ready to plan your wedding, birthday, festival, or anniversary? Our AI engine can generate a full blueprint in 5 seconds.
            </p>
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              <span>Create Your First Celebration</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((evt) => {
              const days = daysUntil(evt.event_date);
              const isOverdue = days !== null && days < 0;

              return (
                <div
                  key={evt.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 p-5 shadow-xs card-hover flex flex-col justify-between"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-300 border border-plum-200 dark:border-plum-800">
                        {evt.category}
                      </span>

                      {evt.is_demo_plan && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Demo Plan
                        </span>
                      )}
                    </div>

                    <Link to={`/events/${evt.id}`}>
                      <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white hover:text-plum-800 dark:hover:text-plum-300 transition-colors">
                        {evt.name}
                      </h3>
                    </Link>

                    {/* Metadata */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-plum-700 shrink-0" />
                        <span>{formatDate(evt.event_date)}</span>
                        {days !== null && (
                          <span className={`font-semibold ml-1 ${isOverdue ? 'text-slate-400' : 'text-emerald-600'}`}>
                            ({isOverdue ? 'Past' : days === 0 ? 'Today!' : `in ${days} days`})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-plum-700 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-plum-700 shrink-0" />
                        <span>{evt.guest_count} attendees</span>
                      </div>
                    </div>

                    {/* Budget & Progress */}
                    <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Budget Target</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(evt.budget_amount, evt.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Spent: {formatCurrency(evt.actual_total, evt.currency)}</span>
                        <span className={evt.actual_total > evt.budget_amount ? 'text-rose-600 font-bold' : ''}>
                          {evt.budget_usage_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      to={`/events/${evt.id}`}
                      className="text-xs font-semibold text-plum-800 dark:text-plum-300 hover:text-plum-900 flex items-center gap-1"
                    >
                      <span>Open Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => setEventToDelete(evt)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete event"
                      aria-label="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(eventToDelete)}
        title="Delete Celebration"
        message={`Are you sure you want to delete "${eventToDelete?.name}"? All associated budget items, checklist tasks, and AI plans will be permanently removed.`}
        confirmLabel="Delete Celebration"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};

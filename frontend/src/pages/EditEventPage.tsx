import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAppToast } from '../layouts/AppLayout';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useAppToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('birthday');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [budgetAmount, setBudgetAmount] = useState<number>(50000);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEvent(id);
        setName(data.name);
        setCategory(data.category);
        setEventDate(data.event_date);
        setLocation(data.location);
        setGuestCount(data.guest_count);
        setBudgetAmount(data.budget_amount);
        setCurrency(data.currency);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load event for editing';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!name.trim()) {
      showToast('Event title cannot be empty', 'error');
      return;
    }

    if (guestCount <= 0 || budgetAmount <= 0) {
      showToast('Guest count and budget must be positive numbers', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await api.updateEvent(id, {
        name: name.trim(),
        category,
        event_date: eventDate,
        location: location.trim(),
        guest_count: Number(guestCount),
        budget_amount: Number(budgetAmount),
        currency,
      });

      showToast('Event details updated successfully!', 'success');
      navigate(`/events/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update event';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading event settings..." size="lg" />;
  }

  if (error) {
    return <ErrorAlert message={error} title="Error loading event" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 pb-16">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to={`/events/${id}`}
          className="p-2 rounded-xl border border-ivory-300 dark:border-slate-800 hover:bg-ivory-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to event"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
            Edit Celebration Parameters
          </h1>
          <p className="text-xs text-slate-500">Update event details, timing, or target budget.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 capitalize"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Event Date *
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Location *
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Estimated Guests *
            </label>
            <input
              type="number"
              min="1"
              required
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Total Budget *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="100"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-bold"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            to={`/events/${id}`}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-ivory-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

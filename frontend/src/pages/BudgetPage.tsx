import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DollarSign,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Edit2,
  Trash2,
  PieChart as PieIcon,
  BarChart2,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ExpenseItem, BudgetSummary, EventItem } from '../services/types';
import { formatCurrency } from '../utils/currency';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAppToast } from '../layouts/AppLayout';

const PIE_COLORS = ['#4A154B', '#862D88', '#D4AF37', '#D9777F', '#2563EB', '#059669', '#D97706', '#64748B'];

export const BudgetPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showToast } = useAppToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Venue');
  const [formEstimated, setFormEstimated] = useState<number>(0);
  const [formActual, setFormActual] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  const fetchBudget = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [evtData, expData] = await Promise.all([
        api.getEvent(eventId),
        api.getExpenses(eventId),
      ]);
      setEvent(evtData);
      setExpenses(expData.expenses || []);
      setSummary(expData.summary);
      setCurrency(expData.currency || 'INR');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load budget data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [eventId]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormName('');
    setFormCategory('Venue');
    setFormEstimated(0);
    setFormActual(0);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormName(exp.name);
    setFormCategory(exp.category);
    setFormEstimated(exp.estimated_amount);
    setFormActual(exp.actual_amount);
    setFormNotes(exp.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!formName.trim()) {
      showToast('Expense name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          name: formName.trim(),
          category: formCategory.trim(),
          estimated_amount: Number(formEstimated) || 0,
          actual_amount: Number(formActual) || 0,
          notes: formNotes.trim(),
        });
        showToast('Expense updated successfully', 'success');
      } else {
        await api.createExpense(eventId, {
          name: formName.trim(),
          category: formCategory.trim(),
          estimated_amount: Number(formEstimated) || 0,
          actual_amount: Number(formActual) || 0,
          notes: formNotes.trim(),
        });
        showToast('Expense added successfully', 'success');
      }

      setIsAddModalOpen(false);
      // Refresh authoritative budget data from backend
      await fetchBudget();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsSaving(true);
      await api.deleteExpense(expenseToDelete.id);
      showToast('Expense removed', 'success');
      setExpenseToDelete(null);
      await fetchBudget();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading interactive budget analytics..." size="lg" />;
  }

  if (error || !event || !summary) {
    return <ErrorAlert message={error || 'Budget unavailable'} onRetry={fetchBudget} />;
  }

  // Filtered expenses
  const categoriesList = ['all', ...Array.from(new Set(expenses.map((e) => e.category)))];
  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === selectedCategory);

  // Chart data
  const pieData = Object.entries(summary.categories || {}).map(([name, vals]) => ({
    name,
    value: vals.actual > 0 ? vals.actual : vals.estimated,
  }));

  const barData = Object.entries(summary.categories || {}).map(([name, vals]) => ({
    category: name,
    Estimated: vals.estimated,
    Actual: vals.actual,
  }));

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/events/${event.id}`}
            className="p-2 rounded-xl border border-ivory-300 dark:border-slate-800 hover:bg-ivory-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to event plan"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Budget Intelligence & Expenses
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {event.name} &bull; Target Budget: <strong>{formatCurrency(summary.budget_amount, currency)}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Over-budget Warning */}
      {summary.is_over_budget && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Over Budget Warning</h4>
            <p className="text-xs mt-0.5 text-rose-800 dark:text-rose-300 leading-relaxed">
              Your actual spending exceeds the target event budget by <strong>{formatCurrency(Math.abs(summary.remaining_budget), currency)}</strong> ({summary.budget_usage_percentage}% utilized). Review expenses or adjust vendor allocations below.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Budget</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(summary.budget_amount, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">~{formatCurrency(summary.budget_amount / Math.max(1, event.guest_count), currency)} / guest</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Total</span>
          <div className="mt-2 text-2xl font-bold text-plum-800 dark:text-plum-400">
            {formatCurrency(summary.estimated_total, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sum of all planned quotes</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Spend</span>
          <div className={`mt-2 text-2xl font-bold ${summary.is_over_budget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(summary.actual_total, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{summary.budget_usage_percentage}% of target committed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Buffer</span>
          <div className={`mt-2 text-2xl font-bold ${summary.remaining_budget < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {formatCurrency(summary.remaining_budget, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{summary.remaining_budget >= 0 ? 'Available surplus' : 'Deficit'}</p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Split Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-plum-700" />
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
              Category Distribution
            </h3>
          </div>

          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No expenses recorded to render charts.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), 'Amount']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', border: 'none' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Estimated vs Actual Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-plum-700" />
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
              Estimated vs Actual Spending
            </h3>
          </div>

          {barData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No categories to compare.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '12px', border: 'none' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Estimated" fill="#862D88" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Expenses Table & Management */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-200 dark:border-slate-800">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
              Line-Item Expenses ({filteredExpenses.length})
            </h3>
            <p className="text-xs text-slate-500">Track vendor quotes, deposits, and settlements.</p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-plum-800 text-white shadow-xs'
                    : 'bg-ivory-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-ivory-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No expense items matching selected filter. Click "+ Add Expense" to log one.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-ivory-200 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3 px-3">Item / Service</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Estimated</th>
                  <th className="py-3 px-3">Actual</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 dark:divide-slate-800">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-ivory-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {exp.name}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-plum-100 dark:bg-plum-950 text-plum-800 dark:text-plum-300 border border-plum-200 dark:border-plum-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(exp.estimated_amount, currency)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(exp.actual_amount, currency)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate" title={exp.notes}>
                      {exp.notes || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-400 hover:text-plum-700 dark:hover:text-plum-300 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-200 dark:border-slate-800">
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Expense Item' : 'Add New Expense Item'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Item / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wedding Mandap Floral Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Venue, Catering, Decor, Photography, Entertainment"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Estimated ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formEstimated}
                    onChange={(e) => setFormEstimated(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Actual / Settled ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formActual}
                    onChange={(e) => setFormActual(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Inclusions
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. 50% deposit paid, final settlement due 3 days prior"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
              </div>

              <div className="pt-4 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm"
                >
                  {isSaving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Remove Expense"
        message={`Are you sure you want to delete expense "${expenseToDelete?.name}"? Your remaining budget will be automatically recalculated.`}
        confirmLabel="Remove Expense"
        isDestructive={true}
        isLoading={isSaving}
        onConfirm={handleDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />

    </div>
  );
};

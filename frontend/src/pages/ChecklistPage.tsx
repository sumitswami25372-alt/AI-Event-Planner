import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ChecklistTaskItem, EventItem } from '../services/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAppToast } from '../layouts/AppLayout';

export const ChecklistPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showToast } = useAppToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [tasks, setTasks] = useState<ChecklistTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ChecklistTaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ChecklistTaskItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const fetchTasks = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [evtData, taskData] = await Promise.all([
        api.getEvent(eventId),
        api.getTasks(eventId),
      ]);
      setEvent(evtData);
      setTasks(taskData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [eventId]);

  const handleToggleComplete = async (task: ChecklistTaskItem) => {
    const nextCompleted = !task.completed;
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
      );
      await api.updateTask(task.id, { completed: nextCompleted });
      showToast(nextCompleted ? 'Task marked complete!' : 'Task marked pending', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task status';
      showToast(msg, 'error');
      // Rollback
      fetchTasks();
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskCategory('General');
    setTaskPriority('medium');
    setTaskDueDate('7 days before event');
    setIsModalOpen(true);
  };

  const openEditModal = (task: ChecklistTaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskPriority(task.priority);
    setTaskDueDate(task.due_date || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!taskTitle.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      if (editingTask) {
        await api.updateTask(editingTask.id, {
          title: taskTitle.trim(),
          category: taskCategory.trim(),
          priority: taskPriority,
          due_date: taskDueDate.trim() || undefined,
        });
        showToast('Task updated successfully', 'success');
      } else {
        await api.createTask(eventId, {
          title: taskTitle.trim(),
          category: taskCategory.trim(),
          priority: taskPriority,
          due_date: taskDueDate.trim() || undefined,
          completed: false,
        });
        showToast('Task added to checklist', 'success');
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setIsSaving(true);
      await api.deleteTask(taskToDelete.id);
      showToast('Task removed', 'success');
      setTaskToDelete(null);
      await fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading checklist and run-of-show schedule..." size="lg" />;
  }

  if (error || !event) {
    return <ErrorAlert message={error || 'Checklist unavailable'} onRetry={fetchTasks} />;
  }

  // Memoized categories and filtered tasks
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(tasks.map((t) => t.category || 'General')))],
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchCat = categoryFilter === 'all' || (t.category || 'General') === categoryFilter;
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
          ? t.completed
          : !t.completed;
      return matchCat && matchStatus;
    });
  }, [tasks, categoryFilter, statusFilter]);

  const { totalCount, completedCount, progressPct } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalCount: total, completedCount: completed, progressPct: pct };
  }, [tasks]);

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
              Checklist & Execution Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {event.name} &bull; Preparation countdown & day-of run-of-show
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Preparation Progress
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {completedCount} of {totalCount} Tasks Completed ({progressPct}%)
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-plum-800 dark:text-plum-400">
            {progressPct}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-gradient-to-r from-plum-800 to-emerald-600 transition-all duration-300"
          ></div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-4 border-t border-ivory-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {(['all', 'pending', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-plum-800 text-white'
                    : 'bg-ivory-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-ivory-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Category:</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  categoryFilter === c
                    ? 'bg-plum-800 text-white font-semibold'
                    : 'bg-ivory-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-ivory-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300 dark:border-slate-800 text-slate-400 text-xs">
            No checklist tasks match the current filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                task.completed
                  ? 'bg-ivory-50/70 dark:bg-slate-900/40 border-ivory-200 dark:border-slate-800/60 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-ivory-300/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-400 hover:border-plum-800'
                  }`}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {task.completed && <CheckCircle2 className="w-4 h-4 text-white fill-emerald-600" />}
                </button>

                <div className="flex-1">
                  <div
                    className={`text-sm font-semibold text-slate-900 dark:text-white ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {task.title}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-ivory-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {task.category || 'General'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        task.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(task)}
                  className="p-1.5 text-slate-400 hover:text-plum-700 dark:hover:text-plum-300 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTaskToDelete(task)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-200 dark:border-slate-800">
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                {editingTask ? 'Edit Checklist Task' : 'Add Checklist Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Schedule final sound line-array check"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    placeholder="e.g. Catering, Venue"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Target Due Timeline
                </label>
                <input
                  type="text"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  placeholder="e.g. 10 days before event"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
              </div>

              <div className="pt-4 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm"
                >
                  {isSaving ? 'Saving...' : editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Remove Task"
        message={`Are you sure you want to remove "${taskToDelete?.title}" from your checklist?`}
        confirmLabel="Remove Task"
        isDestructive={true}
        isLoading={isSaving}
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />

    </div>
  );
};

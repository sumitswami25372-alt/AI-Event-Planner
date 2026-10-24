import {
  ConfigResponse,
  EventItem,
  EventCreatePayload,
  EventUpdatePayload,
  ExpenseItem,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
  ChecklistTaskItem,
  TaskCreatePayload,
  TaskUpdatePayload,
  BudgetSummary,
  AIPlan
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_PREFIX = `${BASE_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_PREFIX}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.detail) {
          if (Array.isArray(errorJson.detail)) {
            errorMessage = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
          } else {
            errorMessage = String(errorJson.detail);
          }
        }
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new ApiError(errorMessage, response.status);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(`Connection error: ${msg}. Is backend running at ${BASE_URL}?`, 0);
  }
}

export const api = {
  // Config & Health
  getConfig: () => request<ConfigResponse>('/config'),
  getHealth: () => request<{ status: string }>('/health'),

  // Events
  getEvents: () => request<{ events: EventItem[]; total_count: number }>('/events'),
  getEvent: (id: string) => request<EventItem>(`/events/${id}`),
  createEvent: (data: EventCreatePayload) => request<EventItem>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEvent: (id: string, data: EventUpdatePayload) => request<EventItem>(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
  generatePlan: (id: string, forceDemo = false) => request<EventItem>(`/events/${id}/generate-plan`, {
    method: 'POST',
    body: JSON.stringify({ force_demo: forceDemo }),
  }),
  getEventPlan: (id: string) => request<{
    event_id: string;
    plan_status: string;
    is_demo_plan: boolean;
    plan: AIPlan | null;
  }>(`/events/${id}/plan`),

  // Expenses
  getExpenses: (eventId: string) => request<{
    event_id: string;
    currency: string;
    summary: BudgetSummary;
    expenses: ExpenseItem[];
  }>(`/events/${eventId}/expenses`),
  createExpense: (eventId: string, data: ExpenseCreatePayload) => request<ExpenseItem>(`/events/${eventId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateExpense: (expenseId: string, data: ExpenseUpdatePayload) => request<ExpenseItem>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteExpense: (expenseId: string) => request<void>(`/expenses/${expenseId}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (eventId: string) => request<ChecklistTaskItem[]>(`/events/${eventId}/tasks`),
  createTask: (eventId: string, data: TaskCreatePayload) => request<ChecklistTaskItem>(`/events/${eventId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTask: (taskId: string, data: TaskUpdatePayload) => request<ChecklistTaskItem>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteTask: (taskId: string) => request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),

  // PDF Export
  getExportPdfUrl: (eventId: string) => `${API_PREFIX}/events/${eventId}/export-pdf`,
  downloadPdf: async (eventId: string, eventName: string) => {
    const url = `${API_PREFIX}/events/${eventId}/export-pdf`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Failed to download PDF (status ${res.status})`, res.status);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `celebrai_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};

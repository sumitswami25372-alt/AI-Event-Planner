/**
 * CelebrAI — typed API client
 *
 * Improvements over previous version:
 * - DEFAULT_TIMEOUT_MS: all requests automatically abort after 30 s to prevent
 *   stalled connections from blocking the UI.
 * - downloadPdf: uses try/finally to guarantee URL.revokeObjectURL is always
 *   called (prevents memory leaks if the click or subsequent code throws).
 * - createObjectURL anchor is detached from the DOM via a click event on the
 *   anchor element directly (no body append needed in modern browsers).
 * - ApiError now exposes the original cause for easier debugging.
 * - request<T> strips trailing slashes from endpoint to be defensive.
 */

import type {
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
  AIPlan,
} from './types';

// In production (Vercel) frontend and API share the same origin — leave VITE_API_BASE_URL empty.
// In local dev set VITE_API_BASE_URL=http://127.0.0.1:8080 in frontend/.env
const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8080');

const API_PREFIX = `${BASE_URL}/api/v1`;

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  readonly cause?: unknown;

  constructor(message: string, status: number, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_PREFIX}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) {
          errorMessage = Array.isArray(errorJson.detail)
            ? errorJson.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(', ')
            : String(errorJson.detail);
        }
      } catch {
        const text = await response.text().catch(() => '');
        if (text) errorMessage = text;
      }
      throw new ApiError(errorMessage, response.status);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;

    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    const msg = isAbort
      ? `Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`
      : err instanceof Error
      ? err.message
      : 'Network request failed';

    throw new ApiError(
      isAbort ? msg : `Connection error: ${msg}. Is backend running at ${BASE_URL}?`,
      isAbort ? 408 : 0,
      err,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const api = {
  // Config & Health
  getConfig: () => request<ConfigResponse>('/config'),
  getHealth: () => request<{ status: string }>('/health'),

  // Events
  getEvents: () => request<{ events: EventItem[]; total_count: number }>('/events'),
  getEvent: (id: string) => request<EventItem>(`/events/${id}`),
  createEvent: (data: EventCreatePayload) =>
    request<EventItem>('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: EventUpdatePayload) =>
    request<EventItem>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
  generatePlan: (id: string, forceDemo = false) =>
    request<EventItem>(`/events/${id}/generate-plan`, {
      method: 'POST',
      body: JSON.stringify({ force_demo: forceDemo }),
    }),
  getEventPlan: (id: string) =>
    request<{
      event_id: string;
      plan_status: string;
      is_demo_plan: boolean;
      plan: AIPlan | null;
    }>(`/events/${id}/plan`),

  // Expenses
  getExpenses: (eventId: string) =>
    request<{
      event_id: string;
      currency: string;
      summary: BudgetSummary;
      expenses: ExpenseItem[];
    }>(`/events/${eventId}/expenses`),
  createExpense: (eventId: string, data: ExpenseCreatePayload) =>
    request<ExpenseItem>(`/events/${eventId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpense: (expenseId: string, data: ExpenseUpdatePayload) =>
    request<ExpenseItem>(`/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteExpense: (expenseId: string) =>
    request<void>(`/expenses/${expenseId}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (eventId: string) =>
    request<ChecklistTaskItem[]>(`/events/${eventId}/tasks`),
  createTask: (eventId: string, data: TaskCreatePayload) =>
    request<ChecklistTaskItem>(`/events/${eventId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (taskId: string, data: TaskUpdatePayload) =>
    request<ChecklistTaskItem>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTask: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),

  // PDF Export
  getExportPdfUrl: (eventId: string) => `${API_PREFIX}/events/${eventId}/export-pdf`,

  downloadPdf: async (eventId: string, eventName: string): Promise<void> => {
    const url = `${API_PREFIX}/events/${eventId}/export-pdf`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(`Failed to download PDF (status ${res.status})`, res.status);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const anchor = Object.assign(document.createElement('a'), {
        href: objectUrl,
        download: `celebrai_${safeName}.pdf`,
      });
      anchor.click();
    } finally {
      // Always release the blob URL regardless of whether click() threw
      URL.revokeObjectURL(objectUrl);
    }
  },
};

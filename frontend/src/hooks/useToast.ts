/**
 * useToast — lightweight in-app notification hook.
 *
 * Improvements:
 * - Uses crypto.randomUUID() for collision-free IDs instead of Math.random()
 * - Auto-dismiss timeout ref is stored and cleared on manual removeToast to
 *   prevent the delayed setState from running on an already-removed toast
 */
import { useState, useCallback, useRef } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const TOAST_DURATION_MS = 4_000;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Map of toast id -> timeout handle so we can cancel on early removal
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      const handle = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);

      timers.current.set(id, handle);
    },
    [],
  );

  return { toasts, addToast, removeToast };
}

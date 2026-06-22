"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  /** auto-dismiss ms, 0 = sticky */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let _id = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++_id;
    const toast: Toast = { id, duration: 4000, ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] })
}));

/** Convenience helpers usable from anywhere (no React import required). */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "error", title, description, duration: 6000 }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "info", title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "warning", title, description, duration: 5000 })
};

const ICONS: Record<ToastKind, string> = {
  success: "✓",
  error: "✕",
  info: "i",
  warning: "!"
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  // Auto-dismiss non-sticky toasts.
  useEffect(() => {
    const timers = toasts
      .filter((t) => (t.duration ?? 0) > 0)
      .map((t) => setTimeout(() => dismiss(t.id), t.duration));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="toaster"
      role="region"
      aria-label="Уведомления"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.kind}`}
          role={t.kind === "error" ? "alert" : "status"}
        >
          <span className="toast__icon" aria-hidden="true">
            {ICONS[t.kind]}
          </span>
          <div className="toast__body">
            <strong className="toast__title">{t.title}</strong>
            {t.description ? (
              <p className="toast__desc">{t.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="toast__close"
            aria-label="Закрыть уведомление"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

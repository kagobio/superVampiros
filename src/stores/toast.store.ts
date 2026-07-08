import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'warning' | 'danger';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

/** Notificaciones transitorias (feedback de acciones como cocinar o aplicar un pack). */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, tone = 'default') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Atajo para mostrar un toast fuera de componentes React. */
export const toast = (message: string, tone?: ToastTone) =>
  useToastStore.getState().show(message, tone);

import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'warning' | 'danger';

/** Acción opcional del toast (p. ej. "Deshacer" tras borrar). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

/** Notificaciones transitorias (feedback de acciones como cocinar o aplicar un pack). */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, tone = 'default', action) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone, action }] }));
    // Los toasts con acción viven más para dar tiempo a pulsarla.
    const ttl = action ? 6000 : 2600;
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ttl);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Atajo para mostrar un toast fuera de componentes React. */
export const toast = (message: string, tone?: ToastTone, action?: ToastAction) =>
  useToastStore.getState().show(message, tone, action);

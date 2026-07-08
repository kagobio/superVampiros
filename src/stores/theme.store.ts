import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemePreference } from '@/domain/settings/settings.types';

type ResolvedTheme = 'dark' | 'light';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Resuelve la preferencia a un tema concreto. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/** Aplica el tema al documento (atributo `data-theme`). */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', resolveTheme(preference));
}

/**
 * Estado de UI del tema. Es preferencia de interfaz (no dato de dominio), por eso
 * vive en Zustand y no en Dexie. Se persiste en localStorage para evitar parpadeo.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'dark',
      setPreference: (preference) => {
        applyTheme(preference);
        set({ preference });
      },
      toggle: () => {
        const next = resolveTheme(get().preference) === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ preference: next });
      },
    }),
    {
      name: 'vamp-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.preference);
      },
    },
  ),
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SyncStatus = 'off' | 'connecting' | 'live' | 'error';

interface SyncState {
  /** ¿El usuario ha activado la sincronización? (persistido) */
  enabled: boolean;
  /** Clave del hogar; solo su hash viaja al servidor. (persistido) */
  householdKey: string | null;
  /** Estado en vivo de la conexión (no persistido). */
  status: SyncStatus;
  error: string | null;
  lastSyncAt: number | null;
  setConfig: (config: { enabled: boolean; householdKey: string | null }) => void;
  setStatus: (status: SyncStatus, error?: string | null) => void;
  markSynced: () => void;
}

/** Genera una clave de hogar de alta entropía (compartida entre dispositivos). */
export function generateHouseholdKey(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      enabled: false,
      householdKey: null,
      status: 'off',
      error: null,
      lastSyncAt: null,
      setConfig: ({ enabled, householdKey }) => set({ enabled, householdKey }),
      setStatus: (status, error = null) => set({ status, error }),
      markSynced: () => set({ lastSyncAt: Date.now(), status: 'live', error: null }),
    }),
    {
      name: 'vamp-sync',
      // Solo persistimos la configuración; el estado en vivo se recalcula.
      partialize: (s) => ({ enabled: s.enabled, householdKey: s.householdKey }),
    },
  ),
);

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/persistence/db';
import { DEFAULT_EXPIRY_SOON_DAYS } from '@/domain/product/product.rules';
import type { Settings } from '@/domain/settings/settings.types';

const FALLBACK: Settings = {
  id: 'settings',
  theme: 'dark',
  expirySoonDays: DEFAULT_EXPIRY_SOON_DAYS,
  defaultUnitId: null,
  seeded: false,
  updatedAt: 0,
};

/** Ajustes globales reactivos (con valores de reserva mientras cargan). */
export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('settings'), [], FALLBACK) ?? FALLBACK;
}

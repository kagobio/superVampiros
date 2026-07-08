import type { Id } from '@/domain/shared/ids';

export type ThemePreference = 'dark' | 'light' | 'system';

/** Ajustes globales de la app (registro singleton en la BD). */
export interface Settings {
  /** Clave fija del singleton. */
  id: 'settings';
  theme: ThemePreference;
  /** Días de antelación para marcar un producto como "caduca pronto". */
  expirySoonDays: number;
  /** Unidad por defecto al crear productos. */
  defaultUnitId: Id | null;
  /** Marca si ya se sembraron los datos iniciales. */
  seeded: boolean;
  updatedAt: number;
}

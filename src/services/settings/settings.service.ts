import { db } from '@/persistence/db';
import { systemClock } from '@/domain/shared/time';
import { DEFAULT_EXPIRY_SOON_DAYS } from '@/domain/product/product.rules';
import type { Settings } from '@/domain/settings/settings.types';

const DEFAULTS: Settings = {
  id: 'settings',
  theme: 'dark',
  expirySoonDays: DEFAULT_EXPIRY_SOON_DAYS,
  defaultUnitId: null,
  seeded: true,
  updatedAt: 0,
};

/** Actualiza campos de los ajustes globales (singleton). */
export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = (await db.settings.get('settings')) ?? DEFAULTS;
  await db.settings.put({ ...current, ...changes, id: 'settings', updatedAt: systemClock.now() });
}

/**
 * Borra todos los datos del hogar. Tras llamarlo, la app debe recargarse para
 * volver a sembrar las taxonomías por defecto.
 */
export async function wipeAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.products,
      db.categories,
      db.locations,
      db.units,
      db.tags,
      db.shoppingItems,
      db.recipes,
      db.packs,
      db.history,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.products.clear(),
        db.categories.clear(),
        db.locations.clear(),
        db.units.clear(),
        db.tags.clear(),
        db.shoppingItems.clear(),
        db.recipes.clear(),
        db.packs.clear(),
        db.history.clear(),
        db.settings.clear(),
      ]);
    },
  );
}

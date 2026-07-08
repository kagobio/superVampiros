import { db } from '@/persistence/db';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock } from '@/domain/shared/time';
import { SEED_CATEGORIES, SEED_LOCATIONS, SEED_UNITS } from '@/config/defaults';
import type { Settings } from '@/domain/settings/settings.types';
import { DEFAULT_EXPIRY_SOON_DAYS } from '@/domain/product/product.rules';

const SETTINGS_ID = 'settings' as const;

/** Deduplica llamadas concurrentes dentro de la misma pestaña (StrictMode, HMR). */
let seeding: Promise<void> | null = null;

/**
 * Siembra las categorías, ubicaciones y unidades de ejemplo la primera vez.
 *
 * Es idempotente y a prueba de concurrencia: la comprobación de `seeded` y la
 * inserción ocurren dentro de una única transacción `rw`. IndexedDB serializa
 * las transacciones de escritura sobre las mismas tablas, de modo que una
 * segunda llamada (p. ej. el doble montaje de StrictMode) ve `seeded=true` y no
 * duplica los datos.
 */
export function ensureSeeded(): Promise<void> {
  if (!seeding) seeding = runSeed();
  return seeding;
}

async function runSeed(): Promise<void> {
  const now = systemClock.now();

  await db.transaction('rw', db.categories, db.locations, db.units, db.settings, async () => {
    const existing = await db.settings.get(SETTINGS_ID);
    if (existing?.seeded) return;

    await db.categories.bulkAdd(
      SEED_CATEGORIES.map((c, i) => ({ ...baseEntity(newId(), now), ...c, order: i })),
    );
    await db.locations.bulkAdd(
      SEED_LOCATIONS.map((l, i) => ({ ...baseEntity(newId(), now), ...l, order: i })),
    );
    const units = SEED_UNITS.map((u, i) => ({ ...baseEntity(newId(), now), ...u, order: i }));
    await db.units.bulkAdd(units);

    const settings: Settings = {
      id: SETTINGS_ID,
      theme: 'dark',
      expirySoonDays: DEFAULT_EXPIRY_SOON_DAYS,
      defaultUnitId: units[0]?.id ?? null,
      seeded: true,
      updatedAt: now,
    };
    await db.settings.put(settings);
  });
}

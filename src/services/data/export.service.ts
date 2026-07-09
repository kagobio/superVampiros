import { db } from '@/persistence/db';
import {
  BACKUP_APP,
  BACKUP_VERSION,
  type BackupData,
  type BackupFile,
} from '@/domain/backup/backup.types';
import { systemClock } from '@/domain/shared/time';
import { toCsv } from '@/lib/csv';
import { toDateInput } from '@/lib/date';

/** Reúne todos los datos del hogar (incluidos tombstones, para round-trip exacto). */
export async function buildBackup(): Promise<BackupFile> {
  const [
    products,
    categories,
    locations,
    units,
    tags,
    shoppingItems,
    recipes,
    packs,
    history,
    settings,
  ] = await Promise.all([
    db.products.toArray(),
    db.categories.toArray(),
    db.locations.toArray(),
    db.units.toArray(),
    db.tags.toArray(),
    db.shoppingItems.toArray(),
    db.recipes.toArray(),
    db.packs.toArray(),
    db.history.toArray(),
    db.settings.get('settings'),
  ]);

  const data: BackupData = {
    products,
    categories,
    locations,
    units,
    tags,
    shoppingItems,
    recipes,
    packs,
    history,
    settings: settings ?? null,
  };

  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: systemClock.now(), data };
}

/** Serializa el backup completo a JSON legible. */
export async function exportJson(): Promise<string> {
  return JSON.stringify(await buildBackup(), null, 2);
}

const PRODUCT_CSV_HEADERS = [
  'nombre',
  'cantidad',
  'unidad',
  'categoria',
  'ubicacion',
  'stock_minimo',
  'favorito',
  'caducidad',
  'etiquetas',
  'notas',
];

/** Exporta los productos vivos a CSV con nombres legibles (no ids). */
export async function exportProductsCsv(): Promise<string> {
  const [products, categories, locations, units, tags] = await Promise.all([
    db.products.toArray(),
    db.categories.toArray(),
    db.locations.toArray(),
    db.units.toArray(),
    db.tags.toArray(),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const locationName = new Map(locations.map((l) => [l.id, l.name]));
  const unitAbbr = new Map(units.map((u) => [u.id, u.abbreviation]));
  const tagName = new Map(tags.map((t) => [t.id, t.name]));

  const rows = products
    .filter((p) => p.deletedAt == null)
    .map((p) => [
      p.name,
      String(p.quantity),
      p.unitId ? (unitAbbr.get(p.unitId) ?? '') : '',
      p.categoryId ? (categoryName.get(p.categoryId) ?? '') : '',
      p.locationId ? (locationName.get(p.locationId) ?? '') : '',
      String(p.minStock),
      p.favorite ? 'sí' : 'no',
      toDateInput(p.expiryDate),
      p.tagIds
        .map((id) => tagName.get(id) ?? '')
        .filter(Boolean)
        .join('|'),
      p.notes,
    ]);

  return toCsv(PRODUCT_CSV_HEADERS, rows);
}

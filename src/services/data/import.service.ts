import type { Table } from 'dexie';
import { db } from '@/persistence/db';
import { backupFileSchema } from './backup.schema';
import { normalizeText } from '@/domain/inventory/inventory-view';
import { fromDateInput } from '@/lib/date';
import { parseCsv } from '@/lib/csv';
import {
  categoryService,
  locationService,
  tagService,
  unitService,
} from '@/services/taxonomy/taxonomy.service';
import { inventoryService } from '@/services/inventory/inventory.service';
import { productRepository } from '@/persistence/repositories/product.repository';
import type { NewProductInput } from '@/domain/product/product.types';

interface Versioned {
  id: string;
  updatedAt?: number;
  revision?: number;
  deletedAt?: number | null;
}

/**
 * Fusiona registros en una tabla con estrategia last-write-wins (por `updatedAt`
 * y, en empate, por `revision`). Respeta tombstones porque el registro entrante
 * viaja con su `deletedAt`. Es la misma política que usará la sincronización.
 */
async function mergeTable<T extends Versioned>(
  table: Table<T, string>,
  incoming: T[],
): Promise<number> {
  let changed = 0;
  for (const record of incoming) {
    const existing = await table.get(record.id);
    if (!existing) {
      await table.put(record);
      changed++;
      continue;
    }
    const inU = record.updatedAt ?? 0;
    const exU = existing.updatedAt ?? 0;
    if (inU > exU || (inU === exU && (record.revision ?? 0) > (existing.revision ?? 0))) {
      await table.put(record);
      changed++;
    }
  }
  return changed;
}

export interface ImportResult {
  ok: boolean;
  changed: number;
  error?: string;
}

/** Importa un backup JSON completo, fusionándolo con los datos actuales. */
export async function importJson(text: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, changed: 0, error: 'El archivo no es un JSON válido.' };
  }

  const result = backupFileSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, changed: 0, error: 'El archivo no es una copia de Alimentos Vampíricos.' };
  }

  // Validada la forma, fusionamos desde el JSON crudo para conservar todos los
  // campos (el parse de Zod descartaría las claves no declaradas en el esquema).
  const d = (parsed as { data: unknown }).data as {
    products: Versioned[];
    categories: Versioned[];
    locations: Versioned[];
    units: Versioned[];
    tags: Versioned[];
    shoppingItems: Versioned[];
    recipes: Versioned[];
    packs: Versioned[];
    history: Versioned[];
    settings: Versioned | null;
  };

  let changed = 0;
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
      changed += await mergeTable(db.products as unknown as Table<Versioned, string>, d.products);
      changed += await mergeTable(
        db.categories as unknown as Table<Versioned, string>,
        d.categories,
      );
      changed += await mergeTable(db.locations as unknown as Table<Versioned, string>, d.locations);
      changed += await mergeTable(db.units as unknown as Table<Versioned, string>, d.units);
      changed += await mergeTable(db.tags as unknown as Table<Versioned, string>, d.tags);
      changed += await mergeTable(
        db.shoppingItems as unknown as Table<Versioned, string>,
        d.shoppingItems,
      );
      changed += await mergeTable(db.recipes as unknown as Table<Versioned, string>, d.recipes);
      changed += await mergeTable(db.packs as unknown as Table<Versioned, string>, d.packs);
      // El historial es append-only: solo añadimos eventos que no existan.
      for (const event of d.history) {
        if (!(await db.history.get(event.id))) {
          await db.history.put(event as never);
          changed++;
        }
      }
      if (d.settings) await db.settings.put(d.settings as never);
    },
  );

  return { ok: true, changed };
}

/** Índice de nombre normalizado → id, con creación perezosa. */
function nameIndex(items: { id: string; name: string }[]): Map<string, string> {
  return new Map(items.map((i) => [normalizeText(i.name), i.id]));
}

/**
 * Importa productos desde CSV. Empareja categoría/ubicación/unidad/etiquetas por
 * nombre (creándolas si faltan) y actualiza el producto si ya existe (por nombre)
 * o lo crea. Cabecera esperada: nombre, cantidad, unidad, categoria, ubicacion,
 * stock_minimo, favorito, caducidad, etiquetas, notas.
 */
export async function importProductsCsv(text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, changed: 0, error: 'El CSV no tiene filas de datos.' };

  const header = rows[0]!.map((h) => normalizeText(h.trim()));
  const col = (name: string) => header.indexOf(name);
  const iName = col('nombre');
  if (iName < 0) return { ok: false, changed: 0, error: 'Falta la columna "nombre".' };

  const iQty = col('cantidad');
  const iUnit = col('unidad');
  const iCat = col('categoria');
  const iLoc = col('ubicacion');
  const iMin = col('stock_minimo');
  const iFav = col('favorito');
  const iExp = col('caducidad');
  const iTags = col('etiquetas');
  const iNotes = col('notas');

  const [categories, locations, units, tags, products] = await Promise.all([
    categoryService.list(),
    locationService.list(),
    unitService.list(),
    tagService.list(),
    productRepository.getAll(),
  ]);

  const catIndex = nameIndex(categories);
  const locIndex = nameIndex(locations);
  // Las unidades se emparejan por nombre o abreviatura.
  const unitIndex = new Map<string, string>();
  for (const u of units) {
    unitIndex.set(normalizeText(u.name), u.id);
    unitIndex.set(normalizeText(u.abbreviation), u.id);
  }
  const tagIndex = nameIndex(tags);
  const productIndex = nameIndex(products);

  const cell = (row: string[], i: number) => (i >= 0 ? (row[i]?.trim() ?? '') : '');

  const ensure = async (
    raw: string,
    index: Map<string, string>,
    create: (name: string) => Promise<{ id: string }>,
  ): Promise<string | null> => {
    const name = raw.trim();
    if (!name) return null;
    const key = normalizeText(name);
    const found = index.get(key);
    if (found) return found;
    const created = await create(name);
    index.set(key, created.id);
    return created.id;
  };

  let changed = 0;
  for (const row of rows.slice(1)) {
    const name = cell(row, iName);
    if (!name) continue;

    const categoryId = await ensure(cell(row, iCat), catIndex, (n) =>
      categoryService.create({ name: n, icon: 'tag', color: '#7A1420' }),
    );
    const locationId = await ensure(cell(row, iLoc), locIndex, (n) =>
      locationService.create({ name: n, icon: 'map-pin', color: '#3B82C4' }),
    );
    const unitId = await ensure(cell(row, iUnit), unitIndex, (n) =>
      unitService.create({ name: n, abbreviation: n }),
    );
    const tagIds: string[] = [];
    for (const tagName of cell(row, iTags).split('|')) {
      const id = await ensure(tagName, tagIndex, (n) =>
        tagService.create({ name: n, color: '#8B5CF6' }),
      );
      if (id) tagIds.push(id);
    }

    const quantity = iQty >= 0 ? Number(cell(row, iQty)) || 0 : 0;
    const minStock = iMin >= 0 ? Number(cell(row, iMin)) || 0 : 0;
    const favorite = /^(s[ií]|true|1|x)$/i.test(cell(row, iFav));
    const expiryDate = fromDateInput(cell(row, iExp));
    const notes = cell(row, iNotes);

    const fields: NewProductInput = {
      name,
      categoryId,
      locationId,
      quantity,
      unitId,
      minStock,
      favorite,
      expiryDate,
      notes,
      tagIds,
    };

    const existingId = productIndex.get(normalizeText(name));
    if (existingId) {
      await inventoryService.update(existingId, fields);
    } else {
      const created = await inventoryService.create(fields);
      productIndex.set(normalizeText(name), created.id);
    }
    changed++;
  }

  return { ok: true, changed };
}

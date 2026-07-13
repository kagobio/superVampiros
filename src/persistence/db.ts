import Dexie, { type Table } from 'dexie';
import type { Product } from '@/domain/product/product.types';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';
import type { Unit } from '@/domain/unit/unit.types';
import type { Tag } from '@/domain/tag/tag.types';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import type { Pack } from '@/domain/pack/pack.types';
import type { HistoryEvent } from '@/domain/history/history.types';
import type { Settings } from '@/domain/settings/settings.types';

/**
 * Base de datos local (IndexedDB vía Dexie). Fuente de verdad de todos los datos.
 * Los índices están elegidos según las consultas de la UI (filtros del plan).
 * El esquema está versionado para permitir migraciones no destructivas.
 */
export class VampireDB extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  locations!: Table<Location, string>;
  units!: Table<Unit, string>;
  tags!: Table<Tag, string>;
  shoppingItems!: Table<ShoppingListItem, string>;
  recipes!: Table<Recipe, string>;
  packs!: Table<Pack, string>;
  history!: Table<HistoryEvent, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('alimentos-vampiricos');

    this.version(1).stores({
      // `*tagIds` es un índice multi-entry para filtrar por etiqueta.
      products:
        'id, name, categoryId, locationId, favorite, expiryDate, updatedAt, deletedAt, *tagIds',
      categories: 'id, order, updatedAt, deletedAt',
      locations: 'id, order, updatedAt, deletedAt',
      units: 'id, order, updatedAt, deletedAt',
      tags: 'id, name, updatedAt, deletedAt',
      shoppingItems: 'id, productId, source, checked, updatedAt, deletedAt',
      recipes: 'id, name, updatedAt, deletedAt',
      packs: 'id, name, updatedAt, deletedAt',
      // Historial / outbox: append-only, indexado por tiempo y entidad.
      history: 'id, timestamp, entityType, entityId, type',
      settings: 'id',
    });

    // v2: índice por `barcode` para reconocer productos al escanear.
    this.version(2).stores({
      products:
        'id, name, categoryId, locationId, favorite, expiryDate, updatedAt, deletedAt, barcode, *tagIds',
    });

    // v3: campo `price` (sin índice). Se rellena a null en los productos ya
    // existentes para que el gasto y la sync partan de un valor explícito.
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('products')
          .toCollection()
          .modify((p: Product) => {
            if (p.price === undefined) p.price = null;
          });
      });
  }
}

/** Instancia única de la base de datos. */
export const db = new VampireDB();

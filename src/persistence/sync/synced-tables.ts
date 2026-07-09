import type { Table } from 'dexie';
import { db } from '@/persistence/db';
import type { Entity } from '@/domain/shared/entity';

/**
 * Tablas que se sincronizan. Cada `entity_type` (string estable) mapea a su tabla
 * Dexie. Se sincronizan los datos del hogar; se excluyen `settings` (preferencias
 * del dispositivo) y `history` (append-only y voluminoso) en esta primera versión.
 */
export const SYNCED_TABLES: Record<string, Table<Entity, string>> = {
  product: db.products as unknown as Table<Entity, string>,
  category: db.categories as unknown as Table<Entity, string>,
  location: db.locations as unknown as Table<Entity, string>,
  unit: db.units as unknown as Table<Entity, string>,
  tag: db.tags as unknown as Table<Entity, string>,
  shopping: db.shoppingItems as unknown as Table<Entity, string>,
  recipe: db.recipes as unknown as Table<Entity, string>,
  pack: db.packs as unknown as Table<Entity, string>,
};

export const SYNCED_TYPES = Object.keys(SYNCED_TABLES);

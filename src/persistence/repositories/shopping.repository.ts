import { db } from '@/persistence/db';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';
import { BaseRepository } from './base-repository';

/**
 * Repositorio de la lista de la compra. Solo persiste los elementos MANUALES;
 * los automáticos se derivan en vivo de los productos bajo mínimo (no se guardan).
 */
export class ShoppingRepository extends BaseRepository<ShoppingListItem> {
  constructor() {
    super(db.shoppingItems);
  }

  /** Elementos manuales vivos, en orden de creación. */
  async listManual(): Promise<ShoppingListItem[]> {
    const rows = await this.getAll();
    return rows.filter((r) => r.source === 'manual').sort((a, b) => a.createdAt - b.createdAt);
  }
}

export const shoppingRepository = new ShoppingRepository();

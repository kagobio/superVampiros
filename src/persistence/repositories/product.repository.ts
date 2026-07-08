import { db } from '@/persistence/db';
import type { Product } from '@/domain/product/product.types';
import { BaseRepository } from './base-repository';

/**
 * Repositorio de productos. Añade consultas específicas sobre la tabla de Dexie.
 * Las lecturas reactivas de la UI envuelven estos métodos con `useLiveQuery`.
 */
export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(db.products);
  }

  /** Todos los productos vivos ordenados por nombre (case-insensitive). */
  async listAll(): Promise<Product[]> {
    const rows = await this.getAll();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }

  /** Productos que referencian una taxonomía dada (para borrados seguros). */
  async countByCategory(categoryId: string): Promise<number> {
    return this.table.where('categoryId').equals(categoryId).count();
  }

  async countByLocation(locationId: string): Promise<number> {
    return this.table.where('locationId').equals(locationId).count();
  }
}

export const productRepository = new ProductRepository();

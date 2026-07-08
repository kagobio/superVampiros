import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';

/** Línea de un pack (producto + cantidad a añadir). */
export interface PackItem {
  productId: Id;
  quantity: number;
  unitId: Id | null;
}

/**
 * Pack de compra reutilizable (p. ej. "Compra Mercadona"). Al aplicarlo, suma
 * al inventario la cantidad de cada línea y registra las compras.
 */
export interface Pack extends Entity {
  name: string;
  items: PackItem[];
}

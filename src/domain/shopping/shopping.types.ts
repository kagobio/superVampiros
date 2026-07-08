import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';

/** Origen de un elemento de la lista de la compra. */
export type ShoppingSource = 'auto' | 'manual';

/**
 * Elemento de la lista de la compra.
 *
 * Los elementos `auto` se derivan del stock mínimo y se gestionan por el
 * servicio (aparecen/desaparecen solos). Los `manual` los añade el usuario y
 * pueden no estar vinculados a un producto del inventario.
 */
export interface ShoppingListItem extends Entity {
  productId: Id | null;
  name: string;
  quantity: number | null;
  unitId: Id | null;
  categoryId: Id | null;
  checked: boolean;
  source: ShoppingSource;
}

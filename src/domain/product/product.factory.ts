import { baseEntity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';
import type { Timestamp } from '@/domain/shared/time';
import type { Product } from './product.types';

/** Campos concretos (sin `undefined`) para construir un producto. */
export interface ProductFields {
  name: string;
  categoryId: Id | null;
  locationId: Id | null;
  quantity: number;
  unitId: Id | null;
  minStock: number;
  favorite: boolean;
  expiryDate: Timestamp | null;
  notes: string;
  icon: string;
  color: string;
  tagIds: Id[];
  barcode: string | null;
}

/**
 * Construye un producto nuevo con sus metadatos base. Función pura: recibe
 * valores ya resueltos (los defaults los aplica el servicio) y un `id`/`now`
 * inyectados para facilitar tests deterministas.
 */
export function buildProduct(id: Id, now: Timestamp, fields: ProductFields): Product {
  return {
    ...baseEntity(id, now),
    ...fields,
    name: fields.name.trim(),
    lastPurchaseAt: null,
  };
}

import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';
import type { Timestamp } from '@/domain/shared/time';

/** Producto del inventario doméstico. Aggregate raíz del módulo de inventario. */
export interface Product extends Entity {
  name: string;
  categoryId: Id | null;
  locationId: Id | null;
  quantity: number;
  unitId: Id | null;
  minStock: number;
  favorite: boolean;
  lastPurchaseAt: Timestamp | null;
  /** Fecha de caducidad (epoch ms) — opcional. */
  expiryDate: Timestamp | null;
  notes: string;
  /** Nombre del icono (Lucide) o emoji. */
  icon: string;
  /** Color de acento del producto (hex). */
  color: string;
  tagIds: Id[];
  /** Código de barras (EAN/UPC) para escanear y reconocer el producto. */
  barcode: string | null;
}

/** Estado de stock derivado (no se persiste). */
export type StockStatus = 'out' | 'low' | 'ok';

/** Estado de caducidad derivado (semáforo 🟢🟠🔴). */
export type ExpiryStatus = 'none' | 'ok' | 'soon' | 'expired';

/** Datos mínimos para crear un producto; el resto se rellena con valores por defecto. */
export interface NewProductInput {
  name: string;
  categoryId?: Id | null;
  locationId?: Id | null;
  quantity?: number;
  unitId?: Id | null;
  minStock?: number;
  favorite?: boolean;
  expiryDate?: Timestamp | null;
  notes?: string;
  icon?: string;
  color?: string;
  tagIds?: Id[];
  barcode?: string | null;
}

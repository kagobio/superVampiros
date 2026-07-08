import type { Timestamp } from '@/domain/shared/time';
import type { ExpiryStatus, Product, StockStatus } from './product.types';

/** Umbral por defecto (días) para considerar que un producto caduca "pronto". */
export const DEFAULT_EXPIRY_SOON_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula el estado de stock. El stock mínimo es el nivel que se quiere
 * mantener: tenerlo justo es aceptable (`ok`); solo por debajo es `low`. Así,
 * reponer hasta el mínimo saca el producto de la lista de la compra.
 */
export function stockStatus(product: Pick<Product, 'quantity' | 'minStock'>): StockStatus {
  if (product.quantity <= 0) return 'out';
  if (product.minStock > 0 && product.quantity < product.minStock) return 'low';
  return 'ok';
}

/** Indica si un producto debe estar en la lista de la compra automática. */
export function needsRestock(product: Pick<Product, 'quantity' | 'minStock'>): boolean {
  return stockStatus(product) !== 'ok';
}

/**
 * Días de calendario (locales) desde `now` hasta la caducidad.
 * 0 = caduca hoy, negativo = ya caducado. Usar días de calendario (y no una
 * simple resta de ms) hace que "hoy"/"mañana" coincidan con la intuición del
 * usuario independientemente de la hora.
 */
export function calendarDaysUntil(expiryDate: Timestamp, now: Timestamp): number {
  const startOfDay = (t: Timestamp) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((startOfDay(expiryDate) - startOfDay(now)) / DAY_MS);
}

/** Calcula el estado de caducidad (semáforo 🟢🟠🔴). */
export function expiryStatus(
  product: Pick<Product, 'expiryDate'>,
  now: Timestamp,
  soonDays: number = DEFAULT_EXPIRY_SOON_DAYS,
): ExpiryStatus {
  if (product.expiryDate == null) return 'none';
  const diffDays = calendarDaysUntil(product.expiryDate, now);
  if (diffDays < 0) return 'expired';
  if (diffDays <= soonDays) return 'soon';
  return 'ok';
}

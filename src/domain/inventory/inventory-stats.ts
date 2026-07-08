import type { Timestamp } from '@/domain/shared/time';
import type { Product } from '@/domain/product/product.types';
import { expiryStatus, needsRestock, stockStatus } from '@/domain/product/product.rules';

/** Ventana (días) para considerar un producto "añadido recientemente". */
export const RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Métricas del inventario que se muestran en el dashboard. */
export interface InventoryStats {
  total: number;
  outOfStock: number;
  toBuy: number;
  expiringSoon: number;
  expired: number;
  favorites: number;
  recent: number;
}

/** Calcula todas las métricas en una sola pasada (pura y testeable). */
export function computeStats(
  products: Product[],
  now: Timestamp,
  soonDays: number,
): InventoryStats {
  const stats: InventoryStats = {
    total: products.length,
    outOfStock: 0,
    toBuy: 0,
    expiringSoon: 0,
    expired: 0,
    favorites: 0,
    recent: 0,
  };

  const recentThreshold = now - RECENT_DAYS * DAY_MS;

  for (const p of products) {
    if (stockStatus(p) === 'out') stats.outOfStock += 1;
    if (needsRestock(p)) stats.toBuy += 1;
    const expiry = expiryStatus(p, now, soonDays);
    if (expiry === 'soon') stats.expiringSoon += 1;
    if (expiry === 'expired') stats.expired += 1;
    if (p.favorite) stats.favorites += 1;
    if (p.createdAt >= recentThreshold) stats.recent += 1;
  }

  return stats;
}

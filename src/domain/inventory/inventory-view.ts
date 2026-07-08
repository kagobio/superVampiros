import type { Timestamp } from '@/domain/shared/time';
import type { Product } from '@/domain/product/product.types';
import { calendarDaysUntil, needsRestock, stockStatus } from '@/domain/product/product.rules';

/** Filtros rápidos combinables de stock/favoritos (se aplican en conjunción: AND). */
export type QuickFilter = 'favorites' | 'toBuy' | 'low' | 'out';

/**
 * Ventana de caducidad (dimensión única, no combinable):
 *  - `today`: caduca hoy · `week`: en los próximos 7 días
 *  - `soon`: dentro del umbral configurable · `expired`: ya caducado
 */
export type ExpiryWindow = 'today' | 'week' | 'soon' | 'expired';

/** Criterios de ordenación del inventario. */
export type SortKey = 'name' | 'quantity' | 'expiry' | 'recent';

/** Estado completo de filtrado + orden del inventario. */
export interface InventoryFilters {
  search: string;
  quick: QuickFilter[];
  expiryWindow: ExpiryWindow | null;
  categoryId: string | null;
  locationId: string | null;
  tagId: string | null;
  sort: SortKey;
}

export const EMPTY_FILTERS: InventoryFilters = {
  search: '',
  quick: [],
  expiryWindow: null,
  categoryId: null,
  locationId: null,
  tagId: null,
  sort: 'name',
};

/** Normaliza texto para búsqueda: minúsculas y sin acentos. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** ¿Hay algún filtro activo (ignorando búsqueda y orden)? */
export function hasActiveFilters(filters: InventoryFilters): boolean {
  return (
    filters.quick.length > 0 ||
    filters.expiryWindow !== null ||
    filters.categoryId !== null ||
    filters.locationId !== null ||
    filters.tagId !== null
  );
}

function matchesQuick(product: Product, quick: QuickFilter[]): boolean {
  if (quick.length === 0) return true;
  const stock = stockStatus(product);
  return quick.every((q) => {
    switch (q) {
      case 'favorites':
        return product.favorite;
      case 'toBuy':
        return needsRestock(product);
      case 'low':
        return stock === 'low';
      case 'out':
        return stock === 'out';
    }
  });
}

/** ¿Encaja el producto en la ventana de caducidad seleccionada? */
export function matchesExpiryWindow(
  product: Pick<Product, 'expiryDate'>,
  window: ExpiryWindow | null,
  now: Timestamp,
  soonDays: number,
): boolean {
  if (window === null) return true;
  if (product.expiryDate == null) return false;
  const days = calendarDaysUntil(product.expiryDate, now);
  switch (window) {
    case 'today':
      return days === 0;
    case 'week':
      return days >= 0 && days <= 7;
    case 'soon':
      return days >= 0 && days <= soonDays;
    case 'expired':
      return days < 0;
  }
}

function compare(a: Product, b: Product, sort: SortKey): number {
  switch (sort) {
    case 'name':
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    case 'quantity':
      return a.quantity - b.quantity;
    case 'expiry': {
      // Sin caducidad va al final; el resto por fecha más próxima primero.
      const av = a.expiryDate ?? Number.POSITIVE_INFINITY;
      const bv = b.expiryDate ?? Number.POSITIVE_INFINITY;
      return av - bv;
    }
    case 'recent':
      return b.createdAt - a.createdAt;
  }
}

/**
 * Aplica búsqueda + filtros + orden a la lista de productos. Función pura: la
 * misma entrada produce siempre la misma salida (fácil de testear).
 */
export function applyInventoryView(
  products: Product[],
  filters: InventoryFilters,
  now: Timestamp,
  soonDays: number,
): Product[] {
  const needle = normalizeText(filters.search.trim());

  const filtered = products.filter((p) => {
    if (
      needle &&
      !normalizeText(p.name).includes(needle) &&
      !normalizeText(p.notes).includes(needle)
    ) {
      return false;
    }
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.locationId && p.locationId !== filters.locationId) return false;
    if (filters.tagId && !p.tagIds.includes(filters.tagId)) return false;
    if (!matchesExpiryWindow(p, filters.expiryWindow, now, soonDays)) return false;
    return matchesQuick(p, filters.quick);
  });

  return filtered.sort((a, b) => compare(a, b, filters.sort));
}

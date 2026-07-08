import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { Product } from '@/domain/product/product.types';
import { computeStats } from './inventory-stats';
import {
  applyInventoryView,
  EMPTY_FILTERS,
  hasActiveFilters,
  matchesExpiryWindow,
} from './inventory-view';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

function product(over: Partial<Product>): Product {
  return {
    ...baseEntity(over.id ?? Math.random().toString(36).slice(2), NOW),
    name: 'X',
    categoryId: null,
    locationId: null,
    quantity: 5,
    unitId: null,
    minStock: 0,
    favorite: false,
    lastPurchaseAt: null,
    expiryDate: null,
    notes: '',
    icon: '',
    color: '#000',
    tagIds: [],
    ...over,
  };
}

describe('computeStats', () => {
  it('cuenta cada métrica correctamente', () => {
    const products = [
      product({ name: 'Agotado', quantity: 0, minStock: 1 }),
      product({ name: 'Bajo', quantity: 1, minStock: 2, favorite: true }),
      product({ name: 'Caduca', expiryDate: NOW + DAY }),
      product({ name: 'Caducado', expiryDate: NOW - DAY }),
      product({ name: 'Nuevo', createdAt: NOW }),
    ];
    const stats = computeStats(products, NOW, 3);
    expect(stats.total).toBe(5);
    expect(stats.outOfStock).toBe(1);
    expect(stats.toBuy).toBe(2); // agotado + bajo
    expect(stats.expiringSoon).toBe(1);
    expect(stats.expired).toBe(1);
    expect(stats.favorites).toBe(1);
    expect(stats.recent).toBeGreaterThanOrEqual(1);
  });
});

describe('applyInventoryView', () => {
  const products = [
    product({ name: 'Leche', quantity: 6, favorite: true }),
    product({ name: 'Huevos', quantity: 1, minStock: 2 }),
    product({ name: 'Atún', quantity: 0, minStock: 1, notes: 'lata' }),
  ];

  it('filtra por búsqueda en nombre y notas, sin acentos', () => {
    expect(applyInventoryView(products, { ...EMPTY_FILTERS, search: 'atun' }, NOW, 3)).toHaveLength(
      1,
    );
    expect(applyInventoryView(products, { ...EMPTY_FILTERS, search: 'lata' }, NOW, 3)).toHaveLength(
      1,
    );
  });

  it('filtra por favoritos y por stock bajo (AND)', () => {
    expect(
      applyInventoryView(products, { ...EMPTY_FILTERS, quick: ['favorites'] }, NOW, 3),
    ).toHaveLength(1);
    expect(applyInventoryView(products, { ...EMPTY_FILTERS, quick: ['out'] }, NOW, 3)).toHaveLength(
      1,
    );
    expect(
      applyInventoryView(products, { ...EMPTY_FILTERS, quick: ['favorites', 'out'] }, NOW, 3),
    ).toHaveLength(0);
  });

  it('ordena por cantidad ascendente', () => {
    const sorted = applyInventoryView(products, { ...EMPTY_FILTERS, sort: 'quantity' }, NOW, 3);
    expect(sorted.map((p) => p.quantity)).toEqual([0, 1, 6]);
  });
});

describe('hasActiveFilters', () => {
  it('ignora búsqueda y orden', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x', sort: 'recent' })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, quick: ['low'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, categoryId: 'c1' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, expiryWindow: 'today' })).toBe(true);
  });
});

describe('matchesExpiryWindow', () => {
  it('sin ventana, siempre pasa', () => {
    expect(matchesExpiryWindow({ expiryDate: null }, null, NOW, 3)).toBe(true);
  });

  it('excluye productos sin fecha cuando hay ventana', () => {
    expect(matchesExpiryWindow({ expiryDate: null }, 'week', NOW, 3)).toBe(false);
  });

  it('clasifica hoy / semana / pronto / caducado', () => {
    expect(matchesExpiryWindow({ expiryDate: NOW }, 'today', NOW, 3)).toBe(true);
    expect(matchesExpiryWindow({ expiryDate: NOW + 5 * DAY }, 'week', NOW, 3)).toBe(true);
    expect(matchesExpiryWindow({ expiryDate: NOW + 5 * DAY }, 'soon', NOW, 3)).toBe(false);
    expect(matchesExpiryWindow({ expiryDate: NOW + 2 * DAY }, 'soon', NOW, 3)).toBe(true);
    expect(matchesExpiryWindow({ expiryDate: NOW - DAY }, 'expired', NOW, 3)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { Product } from '@/domain/product/product.types';
import { computeStats } from './inventory-stats';
import {
  applyInventoryView,
  EMPTY_FILTERS,
  groupProductsByCategory,
  hasActiveFilters,
  matchesExpiryWindow,
  UNCATEGORIZED_ID,
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
    barcode: null,
    price: null,
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

describe('groupProductsByCategory', () => {
  const categories = [
    { id: 'carne', name: 'Carne', color: '#a00', order: 1 },
    { id: 'lacteos', name: 'Lácteos', color: '#00a', order: 0 },
  ];

  it('agrupa en el orden de las categorías y pone "sin categoría" al final', () => {
    const products = [
      product({ id: 'p1', name: 'Pollo', categoryId: 'carne' }),
      product({ id: 'p2', name: 'Leche', categoryId: 'lacteos' }),
      product({ id: 'p3', name: 'Suelto', categoryId: null }),
    ];
    const groups = groupProductsByCategory(products, categories);
    expect(groups.map((g) => g.id)).toEqual(['lacteos', 'carne', UNCATEGORIZED_ID]);
    expect(groups[2]?.name).toBe('Sin categoría');
  });

  it('omite grupos vacíos y trata una categoría inexistente como sin categoría', () => {
    const products = [
      product({ id: 'p1', name: 'Leche', categoryId: 'lacteos' }),
      product({ id: 'p2', name: 'Fantasma', categoryId: 'borrada' }),
    ];
    const groups = groupProductsByCategory(products, categories);
    expect(groups.map((g) => g.id)).toEqual(['lacteos', UNCATEGORIZED_ID]);
    expect(groups[1]?.products.map((p) => p.id)).toEqual(['p2']);
  });

  it('conserva el orden de entrada de los productos dentro de un grupo', () => {
    const products = [
      product({ id: 'b', name: 'B', categoryId: 'carne' }),
      product({ id: 'a', name: 'A', categoryId: 'carne' }),
    ];
    const groups = groupProductsByCategory(products, categories);
    expect(groups[0]?.products.map((p) => p.id)).toEqual(['b', 'a']);
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

  it('en vista por defecto oculta los agotados (siguen en filtros)', () => {
    // Sin filtros ni búsqueda: Atún (0) se oculta.
    const plain = applyInventoryView(products, { ...EMPTY_FILTERS }, NOW, 3);
    expect(plain.map((p) => p.name)).not.toContain('Atún');
    expect(plain).toHaveLength(2);
    // Con "Para comprar" o "Agotados" sí aparece.
    expect(applyInventoryView(products, { ...EMPTY_FILTERS, quick: ['out'] }, NOW, 3)).toHaveLength(
      1,
    );
  });

  it('ordena por cantidad ascendente (agotados ocultos en vista plana)', () => {
    const sorted = applyInventoryView(products, { ...EMPTY_FILTERS, sort: 'quantity' }, NOW, 3);
    expect(sorted.map((p) => p.quantity)).toEqual([1, 6]);
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

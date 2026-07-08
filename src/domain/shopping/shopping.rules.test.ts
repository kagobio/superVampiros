import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { Product } from '@/domain/product/product.types';
import { productsToRestock, suggestedBuyQuantity } from './shopping.rules';

function product(over: Partial<Product>): Product {
  return {
    ...baseEntity(over.id ?? Math.random().toString(36).slice(2), 0),
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

describe('productsToRestock', () => {
  it('incluye solo los productos agotados o bajo mínimo', () => {
    const list = [
      product({ name: 'ok', quantity: 5, minStock: 2 }),
      product({ name: 'bajo', quantity: 2, minStock: 3 }),
      product({ name: 'agotado', quantity: 0, minStock: 1 }),
    ];
    expect(productsToRestock(list).map((p) => p.name)).toEqual(['bajo', 'agotado']);
  });
});

describe('suggestedBuyQuantity', () => {
  it('sugiere lo necesario para alcanzar el mínimo, al menos 1', () => {
    expect(suggestedBuyQuantity({ quantity: 0, minStock: 4 })).toBe(4);
    expect(suggestedBuyQuantity({ quantity: 3, minStock: 5 })).toBe(2);
    expect(suggestedBuyQuantity({ quantity: 0, minStock: 0 })).toBe(1);
  });
});

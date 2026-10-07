import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { Product } from '@/domain/product/product.types';
import { matchIngredientsToProducts } from './ingredient-match';

function product(id: string, name: string, unitId: string | null = null): Product {
  return {
    ...baseEntity(id, 0),
    name,
    categoryId: null,
    locationId: null,
    quantity: 0,
    unitId,
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
  };
}

const products = [product('p1', 'Arroz'), product('p2', 'Pollo', 'kg'), product('p3', 'Tomate')];

describe('matchIngredientsToProducts', () => {
  it('empareja por nombre normalizado (sin acentos, coincidencia parcial)', () => {
    const { ingredients, missing } = matchIngredientsToProducts(
      ['arróz', 'pechuga de pollo', 'azafrán'],
      products,
    );
    expect(ingredients.map((i) => i.productId)).toEqual(['p1', 'p2']);
    expect(ingredients[1]).toMatchObject({ productId: 'p2', quantity: 1, unitId: 'kg' });
    expect(missing).toEqual(['azafrán']);
  });

  it('respeta la cantidad cuando el ingrediente la trae', () => {
    const { ingredients } = matchIngredientsToProducts(
      [
        { name: 'arroz', quantity: 3 },
        { name: 'pollo', quantity: 2 },
      ],
      products,
    );
    expect(ingredients).toEqual([
      { productId: 'p1', quantity: 3, unitId: null },
      { productId: 'p2', quantity: 2, unitId: 'kg' },
    ]);
  });

  it('usa cantidad 1 cuando el ingrediente es solo un nombre', () => {
    const { ingredients } = matchIngredientsToProducts(['arroz'], products);
    expect(ingredients[0]).toMatchObject({ productId: 'p1', quantity: 1 });
  });

  it('no duplica un producto que aparece varias veces', () => {
    const { ingredients } = matchIngredientsToProducts(['arroz', 'Arroz'], products);
    expect(ingredients).toHaveLength(1);
  });

  it('ignora nombres vacíos', () => {
    const { ingredients, missing } = matchIngredientsToProducts(['', '  '], products);
    expect(ingredients).toEqual([]);
    expect(missing).toEqual([]);
  });
});

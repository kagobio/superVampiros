import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/domain/product/product.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { baseEntity } from '@/domain/shared/entity';
import { HABITUAL_MEALS } from '@/config/habitual-meals';
import type { NewRecipeInput } from '@/services/recipe/recipe.service';
import { addHabitualMeals, buildHabitualRecipeInput } from './habitual-meals.service';

function product(id: string, name: string): Product {
  return {
    ...baseEntity(id, 0),
    name,
    categoryId: null,
    locationId: null,
    quantity: 1,
    unitId: 'u1',
    minStock: 0,
    favorite: false,
    lastPurchaseAt: null,
    expiryDate: null,
    notes: '',
    icon: '',
    color: '',
    tagIds: [],
    barcode: null,
    price: null,
  };
}

function recipe(name: string): Recipe {
  return { ...baseEntity(name, 0), name, description: '', servings: null, ingredients: [] };
}

describe('buildHabitualRecipeInput', () => {
  it('enlaza los ingredientes que existen en el inventario, con su cantidad, y marca favorita', () => {
    const meal = {
      name: 'Prueba',
      servings: 2,
      ingredients: [
        { name: 'Arroz', quantity: 3 },
        { name: 'Marciano', quantity: 1 },
      ],
      steps: ['Paso 1'],
    };
    const input = buildHabitualRecipeInput(meal, [product('p-arroz', 'Arroz')]);
    expect(input.favorite).toBe(true);
    expect(input.servings).toBe(2);
    expect(input.ingredients).toHaveLength(1);
    expect(input.ingredients?.[0]?.productId).toBe('p-arroz');
    expect(input.ingredients?.[0]?.quantity).toBe(3); // conserva la cantidad del config
    expect(input.description).toContain('Paso 1');
    expect(input.description).toContain('Marciano'); // anotado como faltante
  });
});

describe('addHabitualMeals', () => {
  it('crea todas las comidas habituales cuando no hay ninguna', async () => {
    const create = vi.fn(async (input: NewRecipeInput) => recipe(input.name));
    const result = await addHabitualMeals([], {
      listRecipes: async () => [],
      create,
    });
    expect(result.created).toBe(HABITUAL_MEALS.length);
    expect(result.skipped).toBe(0);
    expect(create).toHaveBeenCalledTimes(HABITUAL_MEALS.length);
  });

  it('es idempotente: salta las que ya existen por nombre (sin acentos/mayúsculas)', async () => {
    const create = vi.fn(async (input: NewRecipeInput) => recipe(input.name));
    const result = await addHabitualMeals([], {
      // Mismo nombre con otra capitalización no debe duplicar.
      listRecipes: async () => [recipe('poke'), recipe('LENTEJAS')],
      create,
    });
    expect(result.skipped).toBe(2);
    expect(result.created).toBe(HABITUAL_MEALS.length - 2);
    const created = create.mock.calls.map((c) => c[0].name);
    expect(created).not.toContain('Poke');
    expect(created).not.toContain('Lentejas');
  });
});

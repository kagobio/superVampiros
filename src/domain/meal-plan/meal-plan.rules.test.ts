import { describe, expect, it } from 'vitest';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { baseEntity } from '@/domain/shared/entity';
import type { MealPlan } from './meal-plan.types';
import {
  aggregatePlanIngredients,
  entriesToMap,
  mapToEntries,
  slotKey,
} from './meal-plan.rules';

function recipe(id: string, ingredients: Recipe['ingredients']): Recipe {
  return {
    ...baseEntity(id, 0),
    name: id,
    description: '',
    servings: null,
    ingredients,
  };
}

function plan(entries: MealPlan['entries']): MealPlan {
  return { ...baseEntity('plan', 0), name: 'Semana', entries };
}

describe('entriesToMap / mapToEntries', () => {
  it('hace round-trip conservando las asignaciones', () => {
    const entries = [
      { day: 0, slot: 'lunch' as const, recipeId: 'r1' },
      { day: 2, slot: 'dinner' as const, recipeId: 'r2' },
    ];
    const map = entriesToMap(entries);
    expect(map.get(slotKey(0, 'lunch'))).toBe('r1');
    expect(map.get(slotKey(2, 'dinner'))).toBe('r2');
    // El orden se normaliza por día y hueco.
    expect(mapToEntries(map)).toEqual(entries);
  });

  it('ignora los huecos sin receta', () => {
    const map = new Map<string, string>([[slotKey(1, 'lunch'), '']]);
    expect(mapToEntries(map)).toEqual([]);
  });
});

describe('aggregatePlanIngredients', () => {
  const recipesById = new Map([
    recipe('r1', [
      { productId: 'arroz', quantity: 2, unitId: null },
      { productId: 'pollo', quantity: 1, unitId: 'kg' },
    ]),
    recipe('r2', [{ productId: 'arroz', quantity: 3, unitId: null }]),
  ].map((r) => [r.id, r]));

  it('suma las cantidades por producto entre recetas', () => {
    const result = aggregatePlanIngredients(
      plan([
        { day: 0, slot: 'lunch', recipeId: 'r1' },
        { day: 0, slot: 'dinner', recipeId: 'r2' },
      ]),
      recipesById,
    );
    const arroz = result.find((i) => i.productId === 'arroz');
    expect(arroz?.quantity).toBe(5);
    expect(result.find((i) => i.productId === 'pollo')?.quantity).toBe(1);
  });

  it('cuenta una receta repetida tantas veces como aparezca', () => {
    const result = aggregatePlanIngredients(
      plan([
        { day: 0, slot: 'lunch', recipeId: 'r1' },
        { day: 1, slot: 'lunch', recipeId: 'r1' },
      ]),
      recipesById,
    );
    expect(result.find((i) => i.productId === 'arroz')?.quantity).toBe(4);
    expect(result.find((i) => i.productId === 'pollo')?.quantity).toBe(2);
  });

  it('ignora las recetas que ya no existen', () => {
    const result = aggregatePlanIngredients(
      plan([{ day: 0, slot: 'lunch', recipeId: 'borrada' }]),
      recipesById,
    );
    expect(result).toEqual([]);
  });

  it('separa el mismo producto si tiene distinta unidad', () => {
    const recipes = new Map([
      recipe('a', [{ productId: 'harina', quantity: 1, unitId: 'kg' }]),
      recipe('b', [{ productId: 'harina', quantity: 200, unitId: 'g' }]),
    ].map((r) => [r.id, r]));
    const result = aggregatePlanIngredients(
      plan([
        { day: 0, slot: 'lunch', recipeId: 'a' },
        { day: 0, slot: 'dinner', recipeId: 'b' },
      ]),
      recipes,
    );
    expect(result).toHaveLength(2);
  });
});

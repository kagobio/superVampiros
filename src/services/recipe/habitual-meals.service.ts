import type { Product } from '@/domain/product/product.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { normalizeText } from '@/domain/inventory/inventory-view';
import { recipeRepository } from '@/persistence/repositories/recipe.repository';
import { recipeService, type NewRecipeInput } from '@/services/recipe/recipe.service';
import { matchIngredientsToProducts } from '@/services/recipe/ingredient-match';
import { HABITUAL_MEALS, type HabitualMeal } from '@/config/habitual-meals';

export interface AddHabitualMealsResult {
  /** Recetas creadas en esta llamada. */
  created: number;
  /** Comidas habituales que ya existían (por nombre) y no se duplicaron. */
  skipped: number;
}

/** Construye la receta de una comida habitual emparejando con el inventario. */
export function buildHabitualRecipeInput(meal: HabitualMeal, products: Product[]): NewRecipeInput {
  const { ingredients, missing } = matchIngredientsToProducts(meal.ingredients, products);
  const description = [
    meal.steps.join('\n'),
    missing.length ? `Faltan en inventario: ${missing.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  return { name: meal.name, description, servings: meal.servings, ingredients, favorite: true };
}

/**
 * Crea las comidas habituales de la casa como recetas favoritas, emparejando
 * sus ingredientes con el inventario. Es idempotente: salta las que ya existen
 * comparando por nombre normalizado, de modo que se puede pulsar varias veces
 * sin duplicar. Devuelve cuántas se crearon y cuántas se saltaron.
 */
export async function addHabitualMeals(
  products: Product[],
  deps: {
    listRecipes?: () => Promise<Recipe[]>;
    create?: (input: NewRecipeInput) => Promise<Recipe>;
  } = {},
): Promise<AddHabitualMealsResult> {
  const listRecipes = deps.listRecipes ?? (() => recipeRepository.listAll());
  const create = deps.create ?? ((input) => recipeService.create(input));

  const existing = await listRecipes();
  const existingNames = new Set(existing.map((r) => normalizeText(r.name)));

  let created = 0;
  let skipped = 0;
  for (const meal of HABITUAL_MEALS) {
    if (existingNames.has(normalizeText(meal.name))) {
      skipped += 1;
      continue;
    }
    await create(buildHabitualRecipeInput(meal, products));
    existingNames.add(normalizeText(meal.name));
    created += 1;
  }

  return { created, skipped };
}

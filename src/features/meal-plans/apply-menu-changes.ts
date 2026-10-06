import type { Product } from '@/domain/product/product.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import type { MealSlot } from '@/domain/meal-plan/meal-plan.types';
import { normalizeText } from '@/domain/inventory/inventory-view';
import { recipeService } from '@/services/recipe/recipe.service';
import { matchIngredientsToProducts } from '@/services/recipe/ingredient-match';
import type { GeneratedDish } from '@/services/meal-plan/suggest-menu.service';
import type { MenuEditChange } from '@/services/meal-plan/edit-menu.service';

/** Cambio ya resuelto a (día, hueco, recetaId|null) listo para aplicar a la tabla. */
export interface AppliedChange {
  day: number;
  slot: MealSlot;
  recipeId: string | null;
}

/**
 * Devuelve el id de receta para un plato de la IA: reutiliza una receta
 * existente con el mismo nombre (o una ya creada en esta tanda) y, si no
 * existe, la crea emparejando los ingredientes con el inventario.
 */
async function resolveRecipeId(
  dish: GeneratedDish,
  recipes: Recipe[],
  products: Product[],
  cache: Map<string, string>,
): Promise<string> {
  const key = normalizeText(dish.nombre);
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = recipes.find((r) => normalizeText(r.name) === key);
  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const { ingredients, missing } = matchIngredientsToProducts(
    dish.ingredientes.map((i) => i.nombre),
    products,
  );
  const description = [
    dish.pasos.join('\n'),
    missing.length ? `Faltan: ${missing.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const recipe = await recipeService.create({ name: dish.nombre, description, ingredients });
  cache.set(key, recipe.id);
  return recipe.id;
}

/**
 * Convierte los cambios que devuelve la IA en operaciones sobre la tabla del
 * menú, creando las recetas nuevas que haga falta. No muta la tabla: devuelve la
 * lista de cambios para que el componente los aplique a su estado.
 */
export async function applyMenuChanges(
  changes: MenuEditChange[],
  recipes: Recipe[],
  products: Product[],
): Promise<AppliedChange[]> {
  const cache = new Map<string, string>();
  const applied: AppliedChange[] = [];
  for (const change of changes) {
    const slot: MealSlot = change.momento === 'cena' ? 'dinner' : 'lunch';
    if (change.accion === 'clear') {
      applied.push({ day: change.dia, slot, recipeId: null });
      continue;
    }
    if (!change.receta) continue;
    const recipeId = await resolveRecipeId(change.receta, recipes, products, cache);
    applied.push({ day: change.dia, slot, recipeId });
  }
  return applied;
}

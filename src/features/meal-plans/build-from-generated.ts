import type { Product } from '@/domain/product/product.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import type { MealPlan, MealPlanEntry } from '@/domain/meal-plan/meal-plan.types';
import { normalizeText } from '@/domain/inventory/inventory-view';
import { recipeService } from '@/services/recipe/recipe.service';
import { mealPlanService } from '@/services/meal-plan/meal-plan.service';
import { matchIngredientsToProducts } from '@/services/recipe/ingredient-match';
import type { GeneratedMenu } from '@/services/meal-plan/suggest-menu.service';

/**
 * Convierte un menú generado por la IA en datos reales de la app: crea una
 * receta por cada plato distinto (emparejando ingredientes con el inventario y
 * anotando los que faltan) y un `MealPlan` que las asigna a sus huecos. Las
 * recetas quedan guardadas en la lista de Recetas para reutilizarlas y cocinar.
 *
 * Reutiliza recetas ya existentes cuando el nombre coincide (comparando
 * normalizado), de modo que las comidas habituales que la IA prioriza no se
 * dupliquen y conserven sus ingredientes y su marca de favorita.
 */
export async function createMenuFromGenerated(
  menu: GeneratedMenu,
  products: Product[],
  existingRecipes: Recipe[] = [],
): Promise<MealPlan> {
  const recipeIdByName = new Map<string, string>(
    existingRecipes.map((r) => [normalizeText(r.name), r.id]),
  );
  const entries: MealPlanEntry[] = [];

  for (const item of menu.comidas) {
    const key = normalizeText(item.receta.nombre);
    let recipeId = recipeIdByName.get(key);
    if (!recipeId) {
      const { ingredients, missing } = matchIngredientsToProducts(
        item.receta.ingredientes.map((i) => i.nombre),
        products,
      );
      const description = [
        item.receta.pasos.join('\n'),
        missing.length ? `Faltan: ${missing.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const recipe = await recipeService.create({
        name: item.receta.nombre,
        description,
        ingredients,
      });
      recipeId = recipe.id;
      recipeIdByName.set(key, recipeId);
    }
    entries.push({
      day: item.dia,
      slot: item.momento === 'cena' ? 'dinner' : 'lunch',
      recipeId,
    });
  }

  return mealPlanService.create({ name: menu.nombre || 'Menú semanal', entries });
}

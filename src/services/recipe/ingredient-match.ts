import type { Product } from '@/domain/product/product.types';
import type { RecipeIngredient } from '@/domain/recipe/recipe.types';
import { normalizeText } from '@/domain/inventory/inventory-view';

export interface MatchedIngredients {
  /** Ingredientes emparejados con productos del inventario (sin duplicados). */
  ingredients: RecipeIngredient[];
  /** Nombres de ingredientes que no existen en el inventario. */
  missing: string[];
}

/**
 * Empareja una lista de nombres de ingredientes (p. ej. los que propone la IA)
 * con los productos del inventario, comparando por nombre normalizado (sin
 * acentos, con coincidencia parcial). Los que no existen se devuelven en
 * `missing`. Se usa al guardar recetas del Chef IA y al generar menús con IA.
 */
export function matchIngredientsToProducts(
  names: string[],
  products: Product[],
): MatchedIngredients {
  const findProduct = (ingredientName: string): Product | undefined => {
    const n = normalizeText(ingredientName);
    if (!n) return undefined;
    return products.find((p) => {
      const pn = normalizeText(p.name);
      return pn === n || pn.includes(n) || n.includes(pn);
    });
  };

  const ingredients: RecipeIngredient[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const product = findProduct(name);
    if (product) {
      if (!seen.has(product.id)) {
        seen.add(product.id);
        ingredients.push({ productId: product.id, quantity: 1, unitId: product.unitId });
      }
    } else if (name.trim()) {
      missing.push(name.trim());
    }
  }

  return { ingredients, missing };
}

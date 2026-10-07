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
 * Entrada de ingrediente a emparejar: solo el nombre (cantidad = 1) o el nombre
 * con su cantidad (p. ej. las comidas habituales, que traen cantidades para que
 * la lista de la compra salga ajustada).
 */
export type IngredientInput = string | { name: string; quantity?: number };

/**
 * Empareja una lista de ingredientes (p. ej. los que propone la IA, o las
 * comidas habituales con cantidad) con los productos del inventario, comparando
 * por nombre normalizado (sin acentos, con coincidencia parcial). Los que no
 * existen se devuelven en `missing`. Se usa al guardar recetas del Chef IA, al
 * generar menús con IA y al sembrar las comidas habituales.
 */
export function matchIngredientsToProducts(
  names: IngredientInput[],
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

  for (const entry of names) {
    const name = typeof entry === 'string' ? entry : entry.name;
    const quantity = typeof entry === 'string' ? 1 : (entry.quantity ?? 1);
    const product = findProduct(name);
    if (product) {
      if (!seen.has(product.id)) {
        seen.add(product.id);
        ingredients.push({ productId: product.id, quantity, unitId: product.unitId });
      }
    } else if (name.trim()) {
      missing.push(name.trim());
    }
  }

  return { ingredients, missing };
}

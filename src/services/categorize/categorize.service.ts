/**
 * Clasificación automática de productos con IA. Al añadir un producto sin
 * categoría, se pide a la función serverless (`/.netlify/functions/categorize`)
 * la mejor categoría DE ENTRE LAS EXISTENTES (nunca inventa nuevas). Es una
 * mejora silenciosa: si la IA falla o no hay conexión, el producto se queda sin
 * categoría y no se muestra ningún error.
 */
import { normalizeText } from '@/domain/inventory/inventory-view';
import type { Category } from '@/domain/category/category.types';
import type { Product } from '@/domain/product/product.types';
import { inventoryService } from '@/services/inventory/inventory.service';

/** Valida la categoría devuelta por la IA contra las permitidas. Función pura. */
export function parseCategory(text: string, allowed: string[]): string | null {
  let name: string;
  try {
    const data = JSON.parse(text) as { categoria?: unknown };
    name = typeof data.categoria === 'string' ? data.categoria : '';
  } catch {
    name = text.trim();
  }
  if (!name) return null;
  const needle = normalizeText(name);
  const exact = allowed.find((a) => normalizeText(a) === needle);
  if (exact) return exact;
  // Red de seguridad: si la IA añade matices ("Limpieza del hogar"), casamos solo
  // cuando el nombre de la categoría aparece como palabra/frase COMPLETA. Así se
  // evitan falsos positivos por subcadenas sueltas.
  return (
    allowed.find((a) => {
      const an = normalizeText(a);
      if (an.length < 3) return false;
      const escaped = an.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(needle);
    }) ?? null
  );
}

/** Pide a la IA la mejor categoría (de entre las existentes) para un producto. */
export async function suggestCategory(
  name: string,
  categories: string[],
): Promise<string | null> {
  if (!name.trim() || categories.length === 0) return null;
  try {
    const res = await fetch('/.netlify/functions/categorize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, categories }),
    });
    if (!res.ok) return null;
    return parseCategory(await res.text(), categories);
  } catch {
    return null;
  }
}

/**
 * Asigna en segundo plano una categoría (de las existentes) a un producto recién
 * creado que no tenga ninguna. Silencioso y sin lanzar: si la IA no encaja nada,
 * el producto se queda sin categoría.
 */
export async function autoAssignCategory(
  product: { id: string; name: string; categoryId: string | null },
  categories: Category[],
): Promise<void> {
  if (product.categoryId != null || categories.length === 0) return;
  const suggestion = await suggestCategory(
    product.name,
    categories.map((c) => c.name),
  );
  if (!suggestion) return;
  const match = categories.find((c) => normalizeText(c.name) === normalizeText(suggestion));
  if (match) await inventoryService.update(product.id, { categoryId: match.id });
}

/**
 * Núcleo de clasificación masiva: recorre `targets` secuencialmente (para no
 * saturar la IA), pide su categoría y la aplica solo si cambia. Los que fallen
 * (p. ej. sin conexión) se quedan como estaban. Devuelve cuántos han cambiado.
 */
async function categorizeList(
  targets: Product[],
  categories: Category[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  if (categories.length === 0) return 0;
  const names = categories.map((c) => c.name);
  let changed = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i]!;
    const suggestion = await suggestCategory(p.name, names);
    const match = suggestion
      ? categories.find((c) => normalizeText(c.name) === normalizeText(suggestion))
      : null;
    if (match && match.id !== p.categoryId) {
      await inventoryService.update(p.id, { categoryId: match.id });
      changed += 1;
    }
    onProgress?.(i + 1, targets.length);
  }
  return changed;
}

/**
 * Clasifica con IA todos los productos que aún NO tienen categoría (mejora
 * aditiva, no toca los ya categorizados). Devuelve cuántos se han categorizado.
 */
export function categorizeUncategorized(
  products: Product[],
  categories: Category[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  return categorizeList(
    products.filter((p) => p.categoryId == null),
    categories,
    onProgress,
  );
}

/**
 * Reclasifica con IA TODOS los productos, sustituyendo su categoría actual por la
 * que decida la IA. Sirve para rehacer el orden de golpe (p. ej. tras mejorar la
 * lógica). Devuelve cuántos han cambiado de categoría.
 */
export function recategorizeAll(
  products: Product[],
  categories: Category[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  return categorizeList(products, categories, onProgress);
}

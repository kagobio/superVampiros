/**
 * Clasificación automática de productos con IA. Al añadir un producto sin
 * categoría, se pide a la función serverless (`/.netlify/functions/categorize`)
 * la mejor categoría DE ENTRE LAS EXISTENTES (nunca inventa nuevas). Es una
 * mejora silenciosa: si la IA falla o no hay conexión, el producto se queda sin
 * categoría y no se muestra ningún error.
 */
import { normalizeText } from '@/domain/inventory/inventory-view';
import type { Category } from '@/domain/category/category.types';
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
  return allowed.find((a) => normalizeText(a) === needle) ?? null;
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

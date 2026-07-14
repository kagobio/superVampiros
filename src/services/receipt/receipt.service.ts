/**
 * Lectura de tickets de compra con IA. La foto se envía a la función serverless
 * (`/.netlify/functions/parse-receipt`), que usa un modelo con visión de Groq y
 * devuelve los productos con cantidad y precio. El usuario revisa/corrige antes
 * de aplicar; luego se registran como compras (con su precio) para que cuenten
 * en el gasto del mes.
 */
import { normalizeText } from '@/domain/inventory/inventory-view';
import { round2 } from '@/lib/money';
import type { Product } from '@/domain/product/product.types';
import type { Category } from '@/domain/category/category.types';
import { inventoryService } from '@/services/inventory/inventory.service';
import { autoAssignCategory } from '@/services/categorize/categorize.service';

/** Línea leída de un ticket. */
export interface ReceiptItem {
  nombre: string;
  cantidad: number;
  /** Precio por unidad en euros; null si no se pudo leer. */
  precio: number | null;
}

/** Valida y normaliza la respuesta de la IA (función pura, fácil de testear). */
export function parseReceiptResponse(text: string): ReceiptItem[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  const arr = Array.isArray(data)
    ? data
    : ((data as { productos?: unknown; items?: unknown }).productos ??
      (data as { items?: unknown }).items ??
      []);
  if (!Array.isArray(arr)) return [];

  return arr
    .filter(
      (r): r is Record<string, unknown> =>
        r != null && typeof r === 'object' && typeof (r as { nombre?: unknown }).nombre === 'string',
    )
    .map((r) => ({
      nombre: String(r.nombre).trim(),
      cantidad: typeof r.cantidad === 'number' && r.cantidad > 0 ? r.cantidad : 1,
      precio: typeof r.precio === 'number' && r.precio >= 0 ? round2(r.precio) : null,
    }))
    .filter((item) => item.nombre.length > 0);
}

/** Envía la foto del ticket y devuelve los productos leídos. */
export async function parseReceipt(imageDataUrl: string): Promise<ReceiptItem[]> {
  const res = await fetch('/.netlify/functions/parse-receipt', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo leer el ticket.');
  }
  return parseReceiptResponse(await res.text());
}

/** Busca un producto existente por nombre (normalizado, con inclusión parcial). */
export function findProductByName(name: string, products: Product[]): Product | undefined {
  const n = normalizeText(name);
  if (!n) return undefined;
  return products.find((p) => {
    const pn = normalizeText(p.name);
    return pn === n || pn.includes(n) || n.includes(pn);
  });
}

/** Resultado de aplicar un ticket. */
export interface ApplyReceiptResult {
  added: number;
  updated: number;
}

/**
 * Aplica las líneas revisadas: por cada una, si el producto existe le pone el
 * precio y suma stock (registrando la compra, que cuenta para el gasto); si no,
 * lo crea y la IA le asigna categoría. Devuelve cuántos se han añadido/actualizado.
 */
export async function applyReceiptItems(
  items: ReceiptItem[],
  products: Product[],
  categories: Category[],
): Promise<ApplyReceiptResult> {
  let added = 0;
  let updated = 0;
  for (const item of items) {
    if (!item.nombre.trim()) continue;
    const qty = item.cantidad > 0 ? item.cantidad : 1;
    const match = findProductByName(item.nombre, products);
    if (match) {
      if (item.precio != null) await inventoryService.update(match.id, { price: item.precio });
      // adjustQuantity registra la compra con coste = precio × cantidad.
      await inventoryService.adjustQuantity(match.id, qty);
      updated += 1;
    } else {
      const created = await inventoryService.create({
        name: item.nombre,
        price: item.precio ?? null,
        quantity: 0,
      });
      await inventoryService.adjustQuantity(created.id, qty);
      void autoAssignCategory(created, categories);
      added += 1;
    }
  }
  return { added, updated };
}

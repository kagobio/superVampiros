/**
 * Búsqueda de productos por código de barras en Open Food Facts (base de datos
 * abierta y gratuita de productos de supermercado). Solo se usa cuando escaneas
 * un código que aún no tienes; devuelve el nombre para prerrellenar el alta.
 */

export interface LookupResult {
  name: string;
  imageUrl: string | null;
}

interface OffResponse {
  status?: number;
  product?: {
    product_name_es?: string;
    product_name?: string;
    generic_name_es?: string;
    generic_name?: string;
    brands?: string;
    image_front_small_url?: string;
    image_url?: string;
  };
}

/** Extrae el mejor nombre disponible (prioriza español). Función pura. */
export function parseOffProduct(json: OffResponse): LookupResult | null {
  if (json.status !== 1 || !json.product) return null;
  const p = json.product;
  const name = (
    p.product_name_es ||
    p.product_name ||
    p.generic_name_es ||
    p.generic_name ||
    p.brands ||
    ''
  ).trim();
  if (!name) return null;
  return { name, imageUrl: p.image_front_small_url || p.image_url || null };
}

/** Consulta el producto por código de barras. Devuelve `null` si no se encuentra. */
export async function lookupBarcode(barcode: string): Promise<LookupResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      barcode,
    )}.json?fields=product_name,product_name_es,generic_name,generic_name_es,brands,image_front_small_url,image_url`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return parseOffProduct((await res.json()) as OffResponse);
  } catch {
    return null;
  }
}

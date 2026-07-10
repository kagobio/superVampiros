/**
 * Cliente de sugerencias de recetas con IA. Llama a la función serverless
 * (`/.netlify/functions/suggest-recipes`), que a su vez llama a Gemini con la
 * clave oculta en el servidor. En local (sin Netlify) fallará con un mensaje.
 */

export interface SuggestedIngredient {
  nombre: string;
  tengo: boolean;
}

export interface SuggestedRecipe {
  nombre: string;
  ingredientes: SuggestedIngredient[];
  pasos: string[];
}

/** Valida y normaliza la respuesta de la IA (función pura, fácil de testear). */
export function parseSuggestions(text: string): SuggestedRecipe[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (r): r is SuggestedRecipe =>
        typeof r === 'object' &&
        r !== null &&
        typeof (r as SuggestedRecipe).nombre === 'string' &&
        Array.isArray((r as SuggestedRecipe).ingredientes) &&
        Array.isArray((r as SuggestedRecipe).pasos),
    )
    .map((r) => ({
      nombre: r.nombre,
      ingredientes: r.ingredientes
        .filter((i) => i && typeof i.nombre === 'string')
        .map((i) => ({ nombre: i.nombre, tengo: Boolean(i.tengo) })),
      pasos: r.pasos.filter((p) => typeof p === 'string'),
    }));
}

/** Pide sugerencias de recetas a partir de los nombres del inventario. */
export async function suggestRecipes(items: string[]): Promise<SuggestedRecipe[]> {
  const res = await fetch('/.netlify/functions/suggest-recipes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudieron sugerir recetas.');
  }
  return parseSuggestions(await res.text());
}

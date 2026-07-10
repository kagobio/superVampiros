/**
 * Cliente del "Chef IA": chat de recetas basado en el inventario. Llama a la
 * función serverless (`/.netlify/functions/suggest-recipes`), que a su vez habla
 * con Groq con la clave oculta en el servidor. En local (sin Netlify) fallará con
 * un mensaje claro.
 *
 * Cada respuesta de la IA es un objeto { mensaje, recetas[] }: `mensaje` es una
 * frase conversacional y `recetas` son 0+ fichas de receta que el usuario puede
 * guardar. El chat mantiene el contexto enviando el historial en cada turno.
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

/** Respuesta de la IA en un turno del chat. */
export interface ChatReply {
  mensaje: string;
  recetas: SuggestedRecipe[];
}

export type ChatRole = 'user' | 'assistant';

/** Turno tal cual se envía a la función (assistant.content = JSON del turno). */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Normaliza un array desconocido a recetas válidas (defensivo). */
function normalizeRecipes(data: unknown): SuggestedRecipe[] {
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

/** Valida y normaliza la respuesta de la IA (función pura, fácil de testear). */
export function parseChatResponse(text: string): ChatReply {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Si no es JSON, tratamos el texto como el mensaje conversacional.
    return { mensaje: text.trim(), recetas: [] };
  }
  if (Array.isArray(data)) return { mensaje: '', recetas: normalizeRecipes(data) };
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    return {
      mensaje: typeof obj.mensaje === 'string' ? obj.mensaje : '',
      recetas: normalizeRecipes(obj.recetas ?? obj.recipes ?? []),
    };
  }
  return { mensaje: '', recetas: [] };
}

/**
 * Envía el historial del chat + el inventario y devuelve la respuesta de la IA.
 * `items` son los nombres de los productos en stock (contexto del asistente).
 */
export async function chatRecipes(items: string[], messages: ChatMessage[]): Promise<ChatReply> {
  const res = await fetch('/.netlify/functions/suggest-recipes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items, messages }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo hablar con el Chef IA.');
  }
  return parseChatResponse(await res.text());
}

/**
 * Cliente de "Generar menú con IA": llama a la función serverless
 * (`/.netlify/functions/suggest-menu`), que habla con Groq con la clave oculta
 * en el servidor. Devuelve un menú semanal completo (comida y cena por día) a
 * partir de las preferencias del usuario y su inventario.
 */

export type MenuMoment = 'comida' | 'cena';

export interface GeneratedIngredient {
  nombre: string;
  tengo: boolean;
}

export interface GeneratedDish {
  nombre: string;
  ingredientes: GeneratedIngredient[];
  pasos: string[];
}

/** Un hueco del menú generado (día + momento + plato). */
export interface GeneratedMenuSlot {
  dia: number;
  momento: MenuMoment;
  receta: GeneratedDish;
}

export interface GeneratedMenu {
  nombre: string;
  comidas: GeneratedMenuSlot[];
}

function normalizeDish(data: unknown): GeneratedDish | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.nombre !== 'string' || !d.nombre.trim()) return null;
  const ingredientes = Array.isArray(d.ingredientes)
    ? d.ingredientes
        .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === 'object')
        .filter((i) => typeof i.nombre === 'string')
        .map((i) => ({ nombre: i.nombre as string, tengo: Boolean(i.tengo) }))
    : [];
  const pasos = Array.isArray(d.pasos) ? d.pasos.filter((p): p is string => typeof p === 'string') : [];
  return { nombre: d.nombre, ingredientes, pasos };
}

/** Valida y normaliza la respuesta de la IA (función pura, fácil de testear). */
export function parseMenuResponse(text: string): GeneratedMenu {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { nombre: '', comidas: [] };
  }
  if (!data || typeof data !== 'object') return { nombre: '', comidas: [] };
  const obj = data as Record<string, unknown>;
  const nombre = typeof obj.nombre === 'string' ? obj.nombre : '';
  const raw = Array.isArray(obj.comidas) ? obj.comidas : [];
  const comidas: GeneratedMenuSlot[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const dia = Number(e.dia);
    const momento = e.momento === 'cena' ? 'cena' : 'comida';
    const receta = normalizeDish(e.receta);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6 || !receta) continue;
    comidas.push({ dia, momento, receta });
  }
  return { nombre, comidas };
}

/**
 * Pide a la IA un menú semanal según las preferencias y el inventario.
 * `items` son los nombres de los productos en stock (contexto para la IA).
 */
export async function generateMenu(items: string[], preferences: string): Promise<GeneratedMenu> {
  const res = await fetch('/.netlify/functions/suggest-menu', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items, preferences }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo generar el menú con IA.');
  }
  return parseMenuResponse(await res.text());
}

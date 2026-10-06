/**
 * Cliente del "chat del menú": edita un menú semanal EXISTENTE con IA. El usuario
 * pide cambios en lenguaje natural ("cambia la cena del martes por algo
 * vegetariano", "añade un plato el jueves con lo que caduca", "para la comida del
 * lunes usa estos ingredientes") y la IA devuelve CAMBIOS concretos sobre huecos
 * (poner/quitar), que la app aplica a la tabla. Llama a la función serverless
 * `/.netlify/functions/edit-menu` (Groq con la clave oculta en el servidor).
 */
import {
  normalizeDish,
  type GeneratedDish,
  type MenuMoment,
} from './suggest-menu.service';

/** Un cambio sobre un hueco del menú devuelto por la IA. */
export interface MenuEditChange {
  dia: number;
  momento: MenuMoment;
  accion: 'set' | 'clear';
  /** Plato a colocar (solo cuando accion === 'set'). */
  receta?: GeneratedDish;
}

export interface MenuEditReply {
  mensaje: string;
  cambios: MenuEditChange[];
}

/** Contexto de un hueco ocupado del menú actual (para enviar a la IA). */
export interface MenuSlotContext {
  dia: number;
  momento: MenuMoment;
  nombre: string;
}

export type ChatRole = 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Valida y normaliza la respuesta de la IA (función pura, fácil de testear). */
export function parseMenuEditResponse(text: string): MenuEditReply {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { mensaje: text.trim(), cambios: [] };
  }
  if (!data || typeof data !== 'object') return { mensaje: '', cambios: [] };
  const obj = data as Record<string, unknown>;
  const mensaje = typeof obj.mensaje === 'string' ? obj.mensaje : '';
  const raw = Array.isArray(obj.cambios) ? obj.cambios : [];
  const cambios: MenuEditChange[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const dia = Number(e.dia);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) continue;
    const momento: MenuMoment = e.momento === 'cena' ? 'cena' : 'comida';
    const accion = e.accion === 'clear' ? 'clear' : 'set';
    if (accion === 'clear') {
      cambios.push({ dia, momento, accion });
      continue;
    }
    const receta = normalizeDish(e.receta);
    if (!receta) continue;
    cambios.push({ dia, momento, accion, receta });
  }
  return { mensaje, cambios };
}

/**
 * Envía el menú actual + el inventario + el historial del chat y devuelve los
 * cambios que la IA propone. `items` son los nombres de productos en stock.
 */
export async function editMenu(
  items: string[],
  menu: MenuSlotContext[],
  messages: ChatMessage[],
): Promise<MenuEditReply> {
  const res = await fetch('/.netlify/functions/edit-menu', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items, menu, messages }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo editar el menú con IA.');
  }
  return parseMenuEditResponse(await res.text());
}

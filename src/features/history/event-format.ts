import {
  ChefHat,
  Minus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { HistoryEvent, HistoryEventType } from '@/domain/history/history.types';

export type EventTone = 'default' | 'success' | 'danger' | 'primary';

export interface EventVisual {
  icon: LucideIcon;
  verb: string;
  tone: EventTone;
}

const VISUALS: Record<HistoryEventType, EventVisual> = {
  create: { icon: Plus, verb: 'Añadido', tone: 'success' },
  update: { icon: Pencil, verb: 'Editado', tone: 'default' },
  delete: { icon: Trash2, verb: 'Eliminado', tone: 'danger' },
  purchase: { icon: ShoppingBasket, verb: 'Comprado', tone: 'primary' },
  consume: { icon: Minus, verb: 'Consumido', tone: 'default' },
  cook: { icon: ChefHat, verb: 'Cocinado', tone: 'primary' },
  pack_apply: { icon: PackagePlus, verb: 'Pack añadido', tone: 'primary' },
};

export function eventVisual(type: HistoryEventType): EventVisual {
  return VISUALS[type] ?? { icon: Package, verb: type, tone: 'default' };
}

/** Nombre de la entidad guardado en el evento (o guion si no consta). */
export function eventName(event: HistoryEvent): string {
  const name = event.payload.name;
  return typeof name === 'string' && name ? name : '—';
}

/** Texto del delta de cantidad, con signo, si el evento lo tiene. */
export function eventDelta(event: HistoryEvent): string | null {
  const delta = event.payload.delta;
  if (typeof delta !== 'number' || delta === 0) return null;
  return delta > 0 ? `+${delta}` : `${delta}`;
}

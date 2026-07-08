import type { HistoryEvent, HistoryEventType } from '@/domain/history/history.types';

/** Elemento de un ranking (p. ej. "más consumidos"). */
export interface RankedItem {
  id: string;
  name: string;
  /** Suma de magnitudes (unidades consumidas/compradas). */
  total: number;
  /** Número de eventos. */
  count: number;
}

/** Extrae un string del payload de forma segura. */
function payloadName(event: HistoryEvent): string {
  const name = event.payload.name;
  return typeof name === 'string' ? name : '—';
}

/** Extrae la magnitud (|delta|) del payload; por defecto 1. */
function payloadMagnitude(event: HistoryEvent): number {
  const delta = event.payload.delta;
  return typeof delta === 'number' ? Math.abs(delta) : 1;
}

/** Agrupa eventos por entidad sumando magnitudes, ordenado de mayor a menor. */
function rankByEntity(events: HistoryEvent[], type: HistoryEventType): RankedItem[] {
  const map = new Map<string, RankedItem>();
  for (const event of events) {
    if (event.type !== type) continue;
    const current = map.get(event.entityId) ?? {
      id: event.entityId,
      name: payloadName(event),
      total: 0,
      count: 0,
    };
    current.total += payloadMagnitude(event);
    current.count += 1;
    current.name = payloadName(event);
    map.set(event.entityId, current);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Productos más consumidos (por unidades). */
export function topConsumed(events: HistoryEvent[], limit = 5): RankedItem[] {
  return rankByEntity(events, 'consume').slice(0, limit);
}

/** Productos más comprados (por unidades). */
export function topPurchased(events: HistoryEvent[], limit = 5): RankedItem[] {
  return rankByEntity(events, 'purchase').slice(0, limit);
}

/** Número de eventos por tipo. */
export function countByType(events: HistoryEvent[]): Partial<Record<HistoryEventType, number>> {
  const counts: Partial<Record<HistoryEventType, number>> = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }
  return counts;
}

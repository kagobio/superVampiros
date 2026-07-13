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

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Coste (€) guardado en el evento de compra; 0 si no se conoce. */
function payloadCost(event: HistoryEvent): number {
  const cost = event.payload.cost;
  return typeof cost === 'number' && cost > 0 ? cost : 0;
}

/** Clave 'YYYY-MM' del mes de un timestamp (hora local). */
function monthKeyOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Gasto de un mes concreto de la ventana. */
export interface SpendMonth {
  key: string;
  label: string;
  total: number;
}

/** Resumen de gasto para la pantalla de estadísticas. */
export interface SpendSummary {
  thisMonth: number;
  lastMonth: number;
  /** Últimos `monthsBack` meses, del más antiguo al actual. */
  months: SpendMonth[];
  /** Productos con más gasto este mes. */
  topThisMonth: RankedItem[];
}

/**
 * Calcula el gasto a partir del coste guardado en los eventos de compra. Función
 * pura. Como el coste se congela en el evento, no cambia aunque luego varíe el
 * precio o se borre el producto.
 */
export function spendSummary(events: HistoryEvent[], now: number, monthsBack = 6): SpendSummary {
  const purchases = events.filter((e) => e.type === 'purchase');
  const nowDate = new Date(now);

  const totalByMonth = new Map<string, number>();
  for (const e of purchases) {
    const cost = payloadCost(e);
    if (cost <= 0) continue;
    const key = monthKeyOf(e.timestamp);
    totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + cost);
  }

  const monthKeyAt = (offset: number): string => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const months: SpendMonth[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const key = monthKeyAt(i);
    const label = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    months.push({ key, label, total: round2(totalByMonth.get(key) ?? 0) });
  }

  const thisKey = monthKeyAt(0);

  const byProduct = new Map<string, RankedItem>();
  for (const e of purchases) {
    if (monthKeyOf(e.timestamp) !== thisKey) continue;
    const cost = payloadCost(e);
    if (cost <= 0) continue;
    const cur = byProduct.get(e.entityId) ?? {
      id: e.entityId,
      name: payloadName(e),
      total: 0,
      count: 0,
    };
    cur.total = round2(cur.total + cost);
    cur.count += 1;
    cur.name = payloadName(e);
    byProduct.set(e.entityId, cur);
  }
  const topThisMonth = [...byProduct.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    thisMonth: round2(totalByMonth.get(thisKey) ?? 0),
    lastMonth: round2(totalByMonth.get(monthKeyAt(1)) ?? 0),
    months,
    topThisMonth,
  };
}

/** Número de eventos por tipo. */
export function countByType(events: HistoryEvent[]): Partial<Record<HistoryEventType, number>> {
  const counts: Partial<Record<HistoryEventType, number>> = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }
  return counts;
}

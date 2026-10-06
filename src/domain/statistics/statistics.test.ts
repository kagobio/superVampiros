import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { HistoryEvent, HistoryEventType } from '@/domain/history/history.types';
import {
  countByType,
  purchaseMonths,
  purchasesInMonth,
  spendSummary,
  topConsumed,
  topPurchased,
} from './statistics';

let seq = 0;
function event(
  type: HistoryEventType,
  entityId: string,
  name: string,
  delta?: number,
): HistoryEvent {
  return {
    ...baseEntity(`e${seq++}`, seq),
    type,
    entityType: 'product',
    entityId,
    payload: { name, ...(delta !== undefined ? { delta } : {}) },
    timestamp: seq,
  };
}

const events: HistoryEvent[] = [
  event('consume', 'leche', 'Leche', -1),
  event('consume', 'leche', 'Leche', -2),
  event('consume', 'huevos', 'Huevos', -1),
  event('purchase', 'leche', 'Leche', 6),
  event('purchase', 'atun', 'Atún', 5),
  event('create', 'leche', 'Leche'),
];

describe('topConsumed', () => {
  it('suma unidades consumidas por producto y ordena descendente', () => {
    const top = topConsumed(events);
    expect(top[0]).toMatchObject({ id: 'leche', total: 3, count: 2 });
    expect(top[1]).toMatchObject({ id: 'huevos', total: 1, count: 1 });
  });
});

describe('topPurchased', () => {
  it('suma unidades compradas por producto', () => {
    const top = topPurchased(events);
    expect(top[0]).toMatchObject({ id: 'leche', total: 6 });
    expect(top.find((r) => r.id === 'atun')?.total).toBe(5);
  });
});

describe('countByType', () => {
  it('cuenta eventos por tipo', () => {
    const counts = countByType(events);
    expect(counts.consume).toBe(3);
    expect(counts.purchase).toBe(2);
    expect(counts.create).toBe(1);
  });
});

describe('spendSummary', () => {
  // Fechas a día 15 para que el huso horario no cambie de mes.
  const NOW = new Date(2026, 5, 15).getTime(); // junio 2026

  function purchase(entityId: string, name: string, cost: number | null, date: Date): HistoryEvent {
    return {
      ...baseEntity(`s${seq++}`, seq),
      type: 'purchase',
      entityType: 'product',
      entityId,
      payload: { name, delta: 1, ...(cost != null ? { cost } : {}) },
      timestamp: date.getTime(),
    };
  }

  const spendEvents: HistoryEvent[] = [
    purchase('leche', 'Leche', 2, new Date(2026, 5, 3)),
    purchase('leche', 'Leche', 2, new Date(2026, 5, 20)),
    purchase('pan', 'Pan', 1, new Date(2026, 5, 10)),
    purchase('leche', 'Leche', 3, new Date(2026, 4, 12)), // mes anterior
    purchase('atun', 'Atún', null, new Date(2026, 5, 11)), // sin precio → ignorado
  ];

  it('suma el gasto de este mes y del anterior a partir del coste', () => {
    const s = spendSummary(spendEvents, NOW);
    expect(s.thisMonth).toBe(5); // 2 + 2 + 1
    expect(s.lastMonth).toBe(3);
  });

  it('devuelve una ventana de meses con el actual al final', () => {
    const s = spendSummary(spendEvents, NOW);
    expect(s.months).toHaveLength(6);
    expect(s.months[5]).toMatchObject({ key: '2026-06', total: 5 });
    expect(s.months[4]).toMatchObject({ key: '2026-05', total: 3 });
  });

  it('rankea los productos con más gasto este mes (ignora sin precio)', () => {
    const s = spendSummary(spendEvents, NOW);
    expect(s.topThisMonth[0]).toMatchObject({ id: 'leche', total: 4 });
    expect(s.topThisMonth[1]).toMatchObject({ id: 'pan', total: 1 });
    expect(s.topThisMonth.find((r) => r.id === 'atun')).toBeUndefined();
  });

  describe('purchaseMonths', () => {
    it('lista los meses con compras, del más reciente al más antiguo', () => {
      const months = purchaseMonths(spendEvents);
      expect(months.map((m) => m.key)).toEqual(['2026-06', '2026-05']);
      expect(months[0]).toMatchObject({ key: '2026-06', total: 5, count: 4 });
      expect(months[1]).toMatchObject({ key: '2026-05', total: 3, count: 1 });
    });
  });

  describe('purchasesInMonth', () => {
    it('agrupa los productos comprados en el mes por gasto y unidades', () => {
      const items = purchasesInMonth(spendEvents, '2026-06');
      // leche (4 €, 2 uds) va antes que pan (1 €); atún sin precio aparece al final.
      expect(items.map((i) => i.id)).toEqual(['leche', 'pan', 'atun']);
      expect(items[0]).toMatchObject({ id: 'leche', units: 2, cost: 4, count: 2 });
      expect(items.find((i) => i.id === 'atun')).toMatchObject({ cost: 0, units: 1 });
    });

    it('devuelve vacío si no hubo compras ese mes', () => {
      expect(purchasesInMonth(spendEvents, '2020-01')).toEqual([]);
    });
  });
});

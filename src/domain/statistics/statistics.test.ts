import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { HistoryEvent, HistoryEventType } from '@/domain/history/history.types';
import { countByType, topConsumed, topPurchased } from './statistics';

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

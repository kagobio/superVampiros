import { describe, expect, it } from 'vitest';
import { baseEntity } from '@/domain/shared/entity';
import type { Product } from '@/domain/product/product.types';
import type { HistoryEvent } from '@/domain/history/history.types';
import { predictDepletion, productsRunningLow } from './prediction';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

function product(over: Partial<Product>): Product {
  return {
    ...baseEntity(over.id ?? 'p', NOW),
    name: 'X',
    categoryId: null,
    locationId: null,
    quantity: 5,
    unitId: null,
    minStock: 0,
    favorite: false,
    lastPurchaseAt: null,
    expiryDate: null,
    notes: '',
    icon: '',
    color: '#000',
    tagIds: [],
    barcode: null,
    ...over,
  };
}

let seq = 0;
function consume(productId: string, delta: number, daysAgo: number): HistoryEvent {
  return {
    ...baseEntity(`e${seq++}`, seq),
    type: 'consume',
    entityType: 'product',
    entityId: productId,
    payload: { name: 'X', delta: -Math.abs(delta) },
    timestamp: NOW - daysAgo * DAY,
  };
}

describe('predictDepletion', () => {
  it('estima el consumo diario y los días restantes', () => {
    // 10 unidades consumidas en 10 días → 1 ud/día. Con 5 en stock → 5 días.
    const events = [consume('p', 5, 10), consume('p', 5, 0)];
    const pred = predictDepletion(product({ id: 'p', quantity: 5 }), events, NOW);
    expect(pred).not.toBeNull();
    expect(pred!.perDay).toBeCloseTo(1, 5);
    expect(pred!.daysLeft).toBeCloseTo(5, 5);
  });

  it('devuelve null si hay pocos eventos', () => {
    expect(predictDepletion(product({ id: 'p', quantity: 5 }), [consume('p', 3, 5)], NOW)).toBeNull();
  });

  it('devuelve null si el periodo es demasiado corto', () => {
    const events = [consume('p', 1, 1), consume('p', 1, 0)];
    expect(predictDepletion(product({ id: 'p', quantity: 5 }), events, NOW)).toBeNull();
  });

  it('devuelve null si el producto está agotado', () => {
    const events = [consume('p', 5, 10), consume('p', 5, 0)];
    expect(predictDepletion(product({ id: 'p', quantity: 0 }), events, NOW)).toBeNull();
  });
});

describe('productsRunningLow', () => {
  it('marca los que se agotan pronto e ignora los que ya están bajo mínimo', () => {
    const fast = product({ id: 'fast', quantity: 3 }); // 1/día → 3 días
    const slow = product({ id: 'slow', quantity: 30 }); // 1/día → 30 días
    const low = product({ id: 'low', quantity: 1, minStock: 3 }); // ya bajo mínimo
    const events = [
      consume('fast', 5, 10),
      consume('fast', 5, 0),
      consume('slow', 5, 10),
      consume('slow', 5, 0),
      consume('low', 5, 10),
      consume('low', 5, 0),
    ];
    const upcoming = productsRunningLow([fast, slow, low], events, NOW, 7);
    expect(upcoming.map((u) => u.product.id)).toEqual(['fast']);
  });

  it('ordena por los que se acaban antes', () => {
    const a = product({ id: 'a', quantity: 5 }); // 5 días
    const b = product({ id: 'b', quantity: 2 }); // 2 días
    const events = [
      consume('a', 5, 10),
      consume('a', 5, 0),
      consume('b', 5, 10),
      consume('b', 5, 0),
    ];
    const upcoming = productsRunningLow([a, b], events, NOW, 7);
    expect(upcoming.map((u) => u.product.id)).toEqual(['b', 'a']);
  });
});

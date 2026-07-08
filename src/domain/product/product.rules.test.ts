import { describe, expect, it } from 'vitest';
import { expiryStatus, needsRestock, stockStatus } from './product.rules';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe('stockStatus', () => {
  it('está agotado cuando la cantidad es 0 o menos', () => {
    expect(stockStatus({ quantity: 0, minStock: 2 })).toBe('out');
    expect(stockStatus({ quantity: -1, minStock: 0 })).toBe('out');
  });

  it('está bajo solo por debajo del stock mínimo', () => {
    expect(stockStatus({ quantity: 1, minStock: 2 })).toBe('low');
  });

  it('el mínimo justo es aceptable (ok)', () => {
    expect(stockStatus({ quantity: 2, minStock: 2 })).toBe('ok');
    expect(stockStatus({ quantity: 5, minStock: 2 })).toBe('ok');
    expect(stockStatus({ quantity: 1, minStock: 0 })).toBe('ok');
  });
});

describe('needsRestock', () => {
  it('necesita reposición si está agotado o bajo', () => {
    expect(needsRestock({ quantity: 0, minStock: 1 })).toBe(true);
    expect(needsRestock({ quantity: 1, minStock: 2 })).toBe(true);
    expect(needsRestock({ quantity: 5, minStock: 2 })).toBe(false);
  });
});

describe('expiryStatus', () => {
  it('devuelve "none" sin fecha de caducidad', () => {
    expect(expiryStatus({ expiryDate: null }, NOW)).toBe('none');
  });

  it('marca caducados en el pasado', () => {
    expect(expiryStatus({ expiryDate: NOW - DAY }, NOW)).toBe('expired');
  });

  it('marca "soon" dentro del umbral y "ok" fuera', () => {
    expect(expiryStatus({ expiryDate: NOW + 2 * DAY }, NOW, 3)).toBe('soon');
    expect(expiryStatus({ expiryDate: NOW + 10 * DAY }, NOW, 3)).toBe('ok');
  });
});

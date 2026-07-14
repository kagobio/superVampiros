import { describe, expect, it } from 'vitest';
import type { Product } from '@/domain/product/product.types';
import { findProductByName, parseReceiptResponse } from './receipt.service';

describe('parseReceiptResponse', () => {
  it('parsea productos con cantidad y precio', () => {
    const json = JSON.stringify({
      productos: [
        { nombre: 'Leche entera', cantidad: 2, precio: 0.9 },
        { nombre: 'Pan', cantidad: 1, precio: 1.2 },
      ],
    });
    const out = parseReceiptResponse(json);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ nombre: 'Leche entera', cantidad: 2, precio: 0.9 });
  });

  it('aplica valores por defecto (cantidad 1, precio null) y descarta sin nombre', () => {
    const json = JSON.stringify({
      productos: [
        { nombre: 'Arroz' },
        { nombre: '   ', cantidad: 3 },
        { cantidad: 2, precio: 1 },
      ],
    });
    const out = parseReceiptResponse(json);
    expect(out).toEqual([{ nombre: 'Arroz', cantidad: 1, precio: null }]);
  });

  it('devuelve [] con JSON inválido', () => {
    expect(parseReceiptResponse('no es json')).toEqual([]);
  });
});

describe('findProductByName', () => {
  const products = [{ name: 'Leche' }, { name: 'Pan de molde' }] as Product[];

  it('empareja por nombre normalizado (sin acentos ni mayúsculas)', () => {
    expect(findProductByName('LECHE', products)?.name).toBe('Leche');
  });

  it('empareja por inclusión parcial', () => {
    expect(findProductByName('Pan de molde integral', products)?.name).toBe('Pan de molde');
  });

  it('devuelve undefined si no hay coincidencia', () => {
    expect(findProductByName('Tomate', products)).toBeUndefined();
  });
});

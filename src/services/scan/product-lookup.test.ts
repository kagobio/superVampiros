import { describe, expect, it } from 'vitest';
import { parseOffProduct } from './product-lookup';

describe('parseOffProduct', () => {
  it('prioriza el nombre en español', () => {
    const r = parseOffProduct({
      status: 1,
      product: { product_name: 'Milk', product_name_es: 'Leche entera', image_url: 'x.jpg' },
    });
    expect(r).toEqual({ name: 'Leche entera', imageUrl: 'x.jpg' });
  });

  it('cae a la marca si no hay nombre', () => {
    expect(parseOffProduct({ status: 1, product: { brands: 'Hacendado' } })?.name).toBe(
      'Hacendado',
    );
  });

  it('devuelve null si no se encuentra', () => {
    expect(parseOffProduct({ status: 0 })).toBeNull();
    expect(parseOffProduct({ status: 1, product: {} })).toBeNull();
  });
});

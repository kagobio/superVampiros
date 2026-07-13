import { describe, expect, it } from 'vitest';
import { parseCategory } from './categorize.service';

const allowed = ['Nevera', 'Despensa', 'Limpieza'];

describe('parseCategory', () => {
  it('acepta una categoría de la lista (JSON)', () => {
    expect(parseCategory('{"categoria":"Despensa"}', allowed)).toBe('Despensa');
  });

  it('empareja sin distinguir mayúsculas ni acentos y devuelve la forma canónica', () => {
    expect(parseCategory('{"categoria":"LIMPIEZA"}', allowed)).toBe('Limpieza');
  });

  it('devuelve null si la categoría no está en la lista', () => {
    expect(parseCategory('{"categoria":"Congelador"}', allowed)).toBeNull();
  });

  it('devuelve null con cadena vacía o JSON inválido', () => {
    expect(parseCategory('{"categoria":""}', allowed)).toBeNull();
    expect(parseCategory('no es json', allowed)).toBeNull();
  });
});

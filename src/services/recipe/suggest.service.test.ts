import { describe, expect, it } from 'vitest';
import { parseSuggestions } from './suggest.service';

describe('parseSuggestions', () => {
  it('parsea una lista válida de recetas', () => {
    const json = JSON.stringify([
      {
        nombre: 'Tortilla',
        ingredientes: [
          { nombre: 'Huevos', tengo: true },
          { nombre: 'Patata', tengo: false },
        ],
        pasos: ['Batir', 'Freír'],
      },
    ]);
    const out = parseSuggestions(json);
    expect(out).toHaveLength(1);
    expect(out[0]?.nombre).toBe('Tortilla');
    expect(out[0]?.ingredientes[1]).toEqual({ nombre: 'Patata', tengo: false });
  });

  it('descarta entradas inválidas y JSON no válido', () => {
    expect(parseSuggestions('no es json')).toEqual([]);
    expect(parseSuggestions('{"nombre":"x"}')).toEqual([]); // no es array
    expect(parseSuggestions('[{"nombre":123}]')).toEqual([]); // nombre no string
  });
});

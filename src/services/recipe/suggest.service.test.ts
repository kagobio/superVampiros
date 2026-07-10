import { describe, expect, it } from 'vitest';
import { parseChatResponse } from './suggest.service';

describe('parseChatResponse', () => {
  it('parsea { mensaje, recetas } válido', () => {
    const json = JSON.stringify({
      mensaje: 'Aquí tienes una idea:',
      recetas: [
        {
          nombre: 'Tortilla',
          ingredientes: [
            { nombre: 'Huevos', tengo: true },
            { nombre: 'Patata', tengo: false },
          ],
          pasos: ['Batir', 'Freír'],
        },
      ],
    });
    const out = parseChatResponse(json);
    expect(out.mensaje).toBe('Aquí tienes una idea:');
    expect(out.recetas).toHaveLength(1);
    expect(out.recetas[0]?.ingredientes[1]).toEqual({ nombre: 'Patata', tengo: false });
  });

  it('acepta un array pelado de recetas (sin mensaje)', () => {
    const json = JSON.stringify([{ nombre: 'Arroz', ingredientes: [], pasos: [] }]);
    const out = parseChatResponse(json);
    expect(out.mensaje).toBe('');
    expect(out.recetas).toHaveLength(1);
  });

  it('descarta recetas inválidas', () => {
    const out = parseChatResponse('{"mensaje":"x","recetas":[{"nombre":123}]}');
    expect(out.recetas).toEqual([]);
    expect(out.mensaje).toBe('x');
  });

  it('trata el texto no-JSON como mensaje conversacional', () => {
    const out = parseChatResponse('No tengo suficientes ingredientes.');
    expect(out.mensaje).toBe('No tengo suficientes ingredientes.');
    expect(out.recetas).toEqual([]);
  });
});

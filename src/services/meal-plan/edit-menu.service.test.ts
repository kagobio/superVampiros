import { describe, expect, it } from 'vitest';
import { parseMenuEditResponse } from './edit-menu.service';

describe('parseMenuEditResponse', () => {
  it('parsea cambios de tipo set y clear', () => {
    const json = JSON.stringify({
      mensaje: 'Hecho',
      cambios: [
        {
          dia: 1,
          momento: 'cena',
          accion: 'set',
          receta: { nombre: 'Crema de calabacín', ingredientes: [], pasos: ['Cocer'] },
        },
        { dia: 3, momento: 'comida', accion: 'clear' },
      ],
    });
    const reply = parseMenuEditResponse(json);
    expect(reply.mensaje).toBe('Hecho');
    expect(reply.cambios).toHaveLength(2);
    expect(reply.cambios[0]).toMatchObject({ dia: 1, momento: 'cena', accion: 'set' });
    expect(reply.cambios[0]?.receta?.nombre).toBe('Crema de calabacín');
    expect(reply.cambios[1]).toMatchObject({ dia: 3, momento: 'comida', accion: 'clear' });
  });

  it('descarta un set sin receta válida o con día fuera de rango', () => {
    const json = JSON.stringify({
      cambios: [
        { dia: 0, momento: 'comida', accion: 'set', receta: { nombre: '' } },
        { dia: 8, momento: 'cena', accion: 'set', receta: { nombre: 'Fuera' } },
        { dia: 2, momento: 'cena', accion: 'set', receta: { nombre: 'Válida' } },
      ],
    });
    const reply = parseMenuEditResponse(json);
    expect(reply.cambios).toHaveLength(1);
    expect(reply.cambios[0]?.receta?.nombre).toBe('Válida');
  });

  it('trata texto no JSON como mensaje conversacional', () => {
    const reply = parseMenuEditResponse('¿Qué quieres cambiar exactamente?');
    expect(reply.mensaje).toBe('¿Qué quieres cambiar exactamente?');
    expect(reply.cambios).toEqual([]);
  });
});

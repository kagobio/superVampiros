import { describe, expect, it } from 'vitest';
import { parseMenuResponse } from './suggest-menu.service';

describe('parseMenuResponse', () => {
  it('parsea un menú válido', () => {
    const json = JSON.stringify({
      nombre: 'Menú ligero',
      comidas: [
        {
          dia: 0,
          momento: 'comida',
          receta: { nombre: 'Ensalada', ingredientes: [{ nombre: 'Tomate', tengo: true }], pasos: ['Cortar'] },
        },
        {
          dia: 6,
          momento: 'cena',
          receta: { nombre: 'Sopa', ingredientes: [], pasos: [] },
        },
      ],
    });
    const menu = parseMenuResponse(json);
    expect(menu.nombre).toBe('Menú ligero');
    expect(menu.comidas).toHaveLength(2);
    expect(menu.comidas[0]).toMatchObject({ dia: 0, momento: 'comida' });
    expect(menu.comidas[0]?.receta.ingredientes[0]).toMatchObject({ nombre: 'Tomate', tengo: true });
  });

  it('descarta huecos con día fuera de rango o sin receta válida', () => {
    const json = JSON.stringify({
      nombre: 'X',
      comidas: [
        { dia: 9, momento: 'comida', receta: { nombre: 'Fuera de rango' } },
        { dia: 1, momento: 'cena', receta: { nombre: '' } },
        { dia: 2, momento: 'comida', receta: { nombre: 'Válida' } },
      ],
    });
    const menu = parseMenuResponse(json);
    expect(menu.comidas).toHaveLength(1);
    expect(menu.comidas[0]?.receta.nombre).toBe('Válida');
  });

  it('normaliza "momento" desconocido a "comida"', () => {
    const json = JSON.stringify({
      comidas: [{ dia: 0, momento: 'brunch', receta: { nombre: 'Tostada' } }],
    });
    expect(parseMenuResponse(json).comidas[0]?.momento).toBe('comida');
  });

  it('devuelve vacío ante texto no JSON', () => {
    expect(parseMenuResponse('lo siento, no puedo')).toEqual({ nombre: '', comidas: [] });
  });
});

import { describe, expect, it } from 'vitest';
import { guessEmoji } from './emoji';

describe('guessEmoji', () => {
  it('reconoce productos comunes (sin importar acentos/mayúsculas)', () => {
    expect(guessEmoji('Leche entera')).toBe('🥛');
    expect(guessEmoji('Huevos camperos')).toBe('🥚');
    expect(guessEmoji('Plátano de Canarias')).toBe('🍌');
    expect(guessEmoji('Atún claro')).toBe('🐟');
    expect(guessEmoji('Detergente líquido')).toBe('🧼');
    expect(guessEmoji('Aguacate Hass')).toBe('🥑');
    expect(guessEmoji('Brócoli fresco')).toBe('🥦');
    expect(guessEmoji('Pechuga de pollo')).toBe('🍗');
    expect(guessEmoji('Cereales de avena')).toBe('🥣');
  });

  it('acota palabras cortas para evitar falsos positivos', () => {
    expect(guessEmoji('Espinacas frescas')).toBe('🥬'); // no confunde con "piña"
    expect(guessEmoji('Piña en almíbar')).toBe('🍍');
    expect(guessEmoji('Chocolate negro')).toBe('🍫'); // no confunde con "cola"
    expect(guessEmoji('Pan de molde')).toBe('🍞'); // no confunde con "panceta"
  });

  it('devuelve cadena vacía si no reconoce nada', () => {
    expect(guessEmoji('Cosa rara xyz')).toBe('');
  });
});

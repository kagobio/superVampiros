import { describe, expect, it } from 'vitest';
import { guessEmoji } from './emoji';

describe('guessEmoji', () => {
  it('reconoce productos comunes (sin importar acentos/mayúsculas)', () => {
    expect(guessEmoji('Leche entera')).toBe('🥛');
    expect(guessEmoji('Huevos camperos')).toBe('🥚');
    expect(guessEmoji('Plátano de Canarias')).toBe('🍌');
    expect(guessEmoji('Atún claro')).toBe('🐟');
    expect(guessEmoji('Detergente líquido')).toBe('🧼');
  });

  it('devuelve cadena vacía si no reconoce nada', () => {
    expect(guessEmoji('Cosa rara xyz')).toBe('');
  });
});

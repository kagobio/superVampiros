/** Constantes globales de la aplicación. */

export const APP_NAME = 'Alimentos Vampíricos';

/** Color por defecto para nuevos productos (vino sobrio). */
export const DEFAULT_PRODUCT_COLOR = '#8C1D2B';

/** Icono por defecto para nuevos productos ('' = icono de reserva del avatar). */
export const DEFAULT_PRODUCT_ICON = '';

/**
 * Paleta de colores sugerida para el ColorPicker de productos/categorías.
 * Curada para el sistema «Carmesí editorial»: tonos cálidos y naturales que
 * conviven con el acento vino sin competir con él.
 */
export const PALETTE = [
  '#8C1D2B',
  '#C2673F',
  '#D99A2B',
  '#5E8C3F',
  '#2F7D7A',
  '#4A5A8C',
  '#7A4A66',
  '#A7746A',
  '#6C635E',
  '#211B1D',
] as const;

/** Retardo (ms) del debounce para la búsqueda en tiempo real. */
export const SEARCH_DEBOUNCE_MS = 150;

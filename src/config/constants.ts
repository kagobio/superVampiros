/** Constantes globales de la aplicación. */

export const APP_NAME = 'Alimentos Vampíricos';

/** Color por defecto para nuevos productos (granate). */
export const DEFAULT_PRODUCT_COLOR = '#7A1420';

/** Icono por defecto para nuevos productos ('' = icono de reserva del avatar). */
export const DEFAULT_PRODUCT_ICON = '';

/** Paleta de colores sugerida para el ColorPicker de productos/categorías. */
export const PALETTE = [
  '#B0121B',
  '#7A1420',
  '#5B0E14',
  '#C81E2A',
  '#E0932F',
  '#3FB27F',
  '#3B82C4',
  '#8B5CF6',
  '#A7A0AA',
  '#141317',
] as const;

/** Retardo (ms) del debounce para la búsqueda en tiempo real. */
export const SEARCH_DEBOUNCE_MS = 150;

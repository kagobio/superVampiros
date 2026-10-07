/** Constantes globales de la aplicación. */

export const APP_NAME = 'Alimentos Vampíricos';

/** Color por defecto para nuevos productos (coral de marca). */
export const DEFAULT_PRODUCT_COLOR = '#FF5B2E';

/** Icono por defecto para nuevos productos ('' = icono de reserva del avatar). */
export const DEFAULT_PRODUCT_ICON = '';

/**
 * Paleta de colores sugerida para el ColorPicker de productos/categorías.
 * Curada para el sistema «Fresco vibrante»: tonos jugosos y apetecibles que
 * acompañan al coral y al turquesa de marca.
 */
export const PALETTE = [
  '#FF5B2E',
  '#FF9F33',
  '#F2C94C',
  '#27B268',
  '#10B6A4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#E05252',
  '#7C6F64',
] as const;

/** Retardo (ms) del debounce para la búsqueda en tiempo real. */
export const SEARCH_DEBOUNCE_MS = 150;

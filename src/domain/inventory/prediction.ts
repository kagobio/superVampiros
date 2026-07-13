import type { Product } from '@/domain/product/product.types';
import type { HistoryEvent } from '@/domain/history/history.types';
import { stockStatus } from '@/domain/product/product.rules';

const DAY = 24 * 60 * 60 * 1000;

// Mínimos para fiarnos de la estimación: pocos eventos o un periodo muy corto
// darían predicciones erráticas.
const MIN_EVENTS = 2;
const MIN_SPAN_DAYS = 3;

/** Estimación de consumo y agotamiento de un producto. */
export interface Prediction {
  productId: string;
  /** Consumo medio por día (unidades). */
  perDay: number;
  /** Días estimados hasta agotarse con el stock actual. */
  daysLeft: number;
}

/**
 * Estima el consumo diario de un producto a partir de sus eventos de consumo y
 * predice cuántos días quedan hasta agotarse. Devuelve `null` si no hay datos
 * suficientes (pocos eventos o un periodo demasiado corto para fiarse).
 *
 * Heurística sencilla: consumo medio = total consumido / días desde el primer
 * consumo registrado. Es una media, no una regresión; suficiente para avisar.
 */
export function predictDepletion(
  product: Pick<Product, 'id' | 'quantity'>,
  events: HistoryEvent[],
  now: number,
): Prediction | null {
  if (product.quantity <= 0) return null;

  let total = 0;
  let first = now;
  let count = 0;
  for (const e of events) {
    if (e.type !== 'consume' || e.entityId !== product.id) continue;
    const delta = e.payload.delta;
    total += typeof delta === 'number' ? Math.abs(delta) : 1;
    if (e.timestamp < first) first = e.timestamp;
    count += 1;
  }
  if (count < MIN_EVENTS || total <= 0) return null;

  const spanDays = (now - first) / DAY;
  if (spanDays < MIN_SPAN_DAYS) return null;

  const perDay = total / spanDays;
  if (perDay <= 0) return null;

  return { productId: product.id, perDay, daysLeft: product.quantity / perDay };
}

/** Producto que se agotará pronto según su ritmo de consumo. */
export interface UpcomingDepletion {
  product: Product;
  prediction: Prediction;
}

/**
 * Productos que, al ritmo de consumo, se agotarán dentro de `withinDays` días
 * pero que AÚN no están bajo mínimo (esos ya salen en "Por reponer"). Ordenados
 * por los que se acaban antes.
 */
export function productsRunningLow(
  products: Product[],
  events: HistoryEvent[],
  now: number,
  withinDays = 7,
): UpcomingDepletion[] {
  const result: UpcomingDepletion[] = [];
  for (const product of products) {
    // Los agotados/bajo mínimo ya aparecen en la sección "Por reponer".
    if (stockStatus(product) !== 'ok') continue;
    const prediction = predictDepletion(product, events, now);
    if (prediction && prediction.daysLeft <= withinDays) {
      result.push({ product, prediction });
    }
  }
  return result.sort((a, b) => a.prediction.daysLeft - b.prediction.daysLeft);
}

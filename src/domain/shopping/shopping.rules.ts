import type { Product } from '@/domain/product/product.types';
import { needsRestock } from '@/domain/product/product.rules';

/** Productos que deben aparecer en la lista de la compra automática. */
export function productsToRestock(products: Product[]): Product[] {
  return products.filter(needsRestock);
}

/**
 * Cantidad sugerida a comprar para volver a estar por encima del stock mínimo.
 * Nunca menos de 1 (si está agotado sin mínimo definido, sugerimos comprar 1).
 */
export function suggestedBuyQuantity(product: Pick<Product, 'quantity' | 'minStock'>): number {
  return Math.max(product.minStock - product.quantity, 1);
}

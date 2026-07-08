import { useLiveQuery } from 'dexie-react-hooks';
import { productRepository } from '@/persistence/repositories/product.repository';
import type { Product } from '@/domain/product/product.types';

/** Todos los productos vivos, ordenados por nombre (reactivo). */
export function useProducts(): Product[] {
  return useLiveQuery(() => productRepository.listAll(), [], []);
}

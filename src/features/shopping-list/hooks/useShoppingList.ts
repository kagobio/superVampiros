import { useLiveQuery } from 'dexie-react-hooks';
import { shoppingRepository } from '@/persistence/repositories/shopping.repository';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';

/** Elementos manuales de la lista de la compra (reactivo). */
export function useManualItems(): ShoppingListItem[] {
  return useLiveQuery(() => shoppingRepository.listManual(), [], []);
}

import { useLiveQuery } from 'dexie-react-hooks';
import { packRepository } from '@/persistence/repositories/pack.repository';
import type { Pack } from '@/domain/pack/pack.types';

/** Packs vivos ordenados por nombre (reactivo). */
export function usePacks(): Pack[] {
  return useLiveQuery(() => packRepository.listAll(), [], []);
}

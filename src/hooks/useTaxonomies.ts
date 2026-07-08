import { useLiveQuery } from 'dexie-react-hooks';
import {
  categoryService,
  locationService,
  tagService,
  unitService,
} from '@/services/taxonomy/taxonomy.service';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';
import type { Unit } from '@/domain/unit/unit.types';
import type { Tag } from '@/domain/tag/tag.types';

/** Hooks de lectura reactiva de las taxonomías. Devuelven `[]` mientras cargan. */

export function useCategories(): Category[] {
  return useLiveQuery(() => categoryService.list(), [], []);
}

export function useLocations(): Location[] {
  return useLiveQuery(() => locationService.list(), [], []);
}

export function useUnits(): Unit[] {
  return useLiveQuery(() => unitService.list(), [], []);
}

export function useTags(): Tag[] {
  return useLiveQuery(() => tagService.list(), [], []);
}

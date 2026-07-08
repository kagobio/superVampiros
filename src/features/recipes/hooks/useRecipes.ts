import { useLiveQuery } from 'dexie-react-hooks';
import { recipeRepository } from '@/persistence/repositories/recipe.repository';
import type { Recipe } from '@/domain/recipe/recipe.types';

/** Recetas vivas ordenadas por nombre (reactivo). */
export function useRecipes(): Recipe[] {
  return useLiveQuery(() => recipeRepository.listAll(), [], []);
}

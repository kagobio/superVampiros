import { db } from '@/persistence/db';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { BaseRepository } from './base-repository';

/** Repositorio de recetas. */
export class RecipeRepository extends BaseRepository<Recipe> {
  constructor() {
    super(db.recipes);
  }

  /** Recetas vivas ordenadas por nombre. */
  async listAll(): Promise<Recipe[]> {
    const rows = await this.getAll();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }
}

export const recipeRepository = new RecipeRepository();

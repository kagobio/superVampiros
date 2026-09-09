import { db } from '@/persistence/db';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';
import { BaseRepository } from './base-repository';

/** Repositorio de menús semanales. */
export class MealPlanRepository extends BaseRepository<MealPlan> {
  constructor() {
    super(db.mealPlans);
  }

  /** Menús vivos ordenados por nombre. */
  async listAll(): Promise<MealPlan[]> {
    const rows = await this.getAll();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }
}

export const mealPlanRepository = new MealPlanRepository();

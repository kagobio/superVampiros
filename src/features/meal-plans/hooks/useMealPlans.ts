import { useLiveQuery } from 'dexie-react-hooks';
import { mealPlanRepository } from '@/persistence/repositories/meal-plan.repository';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';

/** Menús semanales vivos ordenados por nombre (reactivo). */
export function useMealPlans(): MealPlan[] {
  return useLiveQuery(() => mealPlanRepository.listAll(), [], []);
}

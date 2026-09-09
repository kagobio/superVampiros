import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';

/** Hueco de comida dentro de un día: comida (mediodía) o cena. */
export type MealSlot = 'lunch' | 'dinner';

/**
 * Asignación de una receta a un hueco del menú semanal.
 * `day` es el índice del día de la semana (0 = Lunes … 6 = Domingo).
 */
export interface MealPlanEntry {
  day: number;
  slot: MealSlot;
  recipeId: Id;
}

/**
 * Menú semanal: un conjunto de recetas asignadas a los huecos comida/cena de
 * cada día. De él se derivan (sin persistir) los ingredientes necesarios,
 * sumando los de todas las recetas planificadas.
 */
export interface MealPlan extends Entity {
  name: string;
  entries: MealPlanEntry[];
}

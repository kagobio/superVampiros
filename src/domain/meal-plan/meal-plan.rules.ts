import type { Id } from '@/domain/shared/ids';
import type { Recipe } from '@/domain/recipe/recipe.types';
import type { MealPlan, MealPlanEntry, MealSlot } from './meal-plan.types';

/** Días de la semana (Lunes → Domingo). El índice coincide con `entry.day`. */
export const WEEK_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

/** Huecos de cada día, en orden de aparición. */
export const MEAL_SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'lunch', label: 'Comida' },
  { slot: 'dinner', label: 'Cena' },
];

/** Clave estable de un hueco (día + comida/cena), para índices en la UI. */
export function slotKey(day: number, slot: MealSlot): string {
  return `${day}:${slot}`;
}

/** Convierte las entradas del menú en un mapa `slotKey → recipeId`. */
export function entriesToMap(entries: MealPlanEntry[]): Map<string, Id> {
  return new Map(entries.map((e) => [slotKey(e.day, e.slot), e.recipeId]));
}

/**
 * Reconstruye las entradas a partir de un mapa `slotKey → recipeId`, en orden
 * de día y hueco. Las claves vacías (sin receta) se ignoran.
 */
export function mapToEntries(map: Map<string, Id>): MealPlanEntry[] {
  const entries: MealPlanEntry[] = [];
  for (let day = 0; day < WEEK_DAYS.length; day++) {
    for (const { slot } of MEAL_SLOTS) {
      const recipeId = map.get(slotKey(day, slot));
      if (recipeId) entries.push({ day, slot, recipeId });
    }
  }
  return entries;
}

/** Ingrediente agregado del menú (suma de todas las recetas planificadas). */
export interface AggregatedIngredient {
  productId: Id;
  quantity: number;
  unitId: Id | null;
}

/**
 * Suma los ingredientes de todas las recetas asignadas al menú. Si una receta
 * se repite en varios huecos, sus ingredientes cuentan tantas veces como
 * aparezca. Agrupa por producto + unidad, sumando las cantidades. Las recetas
 * que ya no existen se ignoran.
 */
export function aggregatePlanIngredients(
  plan: MealPlan,
  recipesById: Map<Id, Recipe>,
): AggregatedIngredient[] {
  const totals = new Map<string, AggregatedIngredient>();
  for (const entry of plan.entries) {
    const recipe = recipesById.get(entry.recipeId);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const key = `${ing.productId}:${ing.unitId ?? ''}`;
      const current = totals.get(key);
      if (current) {
        current.quantity += ing.quantity;
      } else {
        totals.set(key, {
          productId: ing.productId,
          quantity: ing.quantity,
          unitId: ing.unitId,
        });
      }
    }
  }
  return [...totals.values()];
}

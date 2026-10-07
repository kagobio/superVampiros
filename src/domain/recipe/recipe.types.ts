import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';

/** Línea de ingrediente de una receta. */
export interface RecipeIngredient {
  productId: Id;
  quantity: number;
  unitId: Id | null;
}

/**
 * Receta. Al marcar "He cocinado", el servicio descuenta del inventario la
 * cantidad de cada ingrediente y registra el consumo en el historial.
 */
export interface Recipe extends Entity {
  name: string;
  description: string;
  servings: number | null;
  ingredients: RecipeIngredient[];
  /**
   * Comida habitual marcada como favorita. Las favoritas se priorizan al
   * generar el menú con IA y aparecen arriba para colocarlas rápido en la
   * semana. Opcional: las recetas anteriores no lo traen (se tratan como
   * `false`), por lo que no hace falta migración de Dexie.
   */
  favorite?: boolean;
}

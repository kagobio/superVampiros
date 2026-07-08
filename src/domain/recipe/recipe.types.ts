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
}

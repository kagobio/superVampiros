import type { Entity } from '@/domain/shared/entity';

/** Unidad de medida configurable (unidades, kg, litros, latas…). */
export interface Unit extends Entity {
  name: string;
  /** Abreviatura mostrada junto a la cantidad (p. ej. "kg", "L"). */
  abbreviation: string;
  order: number;
}

import type { Entity } from '@/domain/shared/entity';

/** Ubicación física configurable donde se guarda un producto. */
export interface Location extends Entity {
  name: string;
  icon: string;
  color: string;
  order: number;
}

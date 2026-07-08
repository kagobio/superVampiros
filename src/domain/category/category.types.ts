import type { Entity } from '@/domain/shared/entity';

/** Categoría configurable (Nevera, Despensa, Limpieza…). */
export interface Category extends Entity {
  name: string;
  icon: string;
  color: string;
  /** Orden manual para reordenar en la UI. */
  order: number;
}

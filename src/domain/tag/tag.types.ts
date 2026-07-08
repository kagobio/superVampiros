import type { Entity } from '@/domain/shared/entity';

/** Etiqueta libre para clasificar productos de forma transversal. */
export interface Tag extends Entity {
  name: string;
  color: string;
}

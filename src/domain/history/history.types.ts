import type { Entity } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';

/** Tipo de entidad a la que hace referencia un evento. */
export type EntityType =
  | 'product'
  | 'category'
  | 'location'
  | 'unit'
  | 'tag'
  | 'shopping'
  | 'recipe'
  | 'pack'
  | 'settings';

/** Tipo de operación registrada. */
export type HistoryEventType =
  'create' | 'update' | 'delete' | 'purchase' | 'consume' | 'cook' | 'pack_apply';

/**
 * Evento del historial. Es una tabla append-only que cumple doble función:
 *  1. Historial consultable por el usuario.
 *  2. Log de operaciones (outbox) para la sincronización futura mediante replay.
 *
 * `payload` guarda el diff/contexto necesario para reconstruir o mostrar la
 * acción (p. ej. delta de cantidad, nombre del producto en el momento).
 */
export interface HistoryEvent extends Entity {
  type: HistoryEventType;
  entityType: EntityType;
  entityId: Id;
  payload: Record<string, unknown>;
  timestamp: number;
}

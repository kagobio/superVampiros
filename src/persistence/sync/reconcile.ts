import type { Entity } from '@/domain/shared/entity';

/** Fila de la tabla `documents` de Supabase. */
export interface SyncDocument {
  household_id: string;
  entity_type: string;
  entity_id: string;
  doc: Entity;
  updated_at: number;
  revision: number;
}

/**
 * Decide si un registro entrante (remoto) debe sustituir al local, con la misma
 * política last-write-wins que el importador: gana el `updatedAt` mayor y, en
 * empate, la `revision` mayor. Función pura → fácil de testear.
 */
export function shouldApplyIncoming(
  local: Pick<Entity, 'updatedAt' | 'revision'> | undefined,
  incoming: Pick<Entity, 'updatedAt' | 'revision'>,
): boolean {
  if (!local) return true;
  if (incoming.updatedAt !== local.updatedAt) return incoming.updatedAt > local.updatedAt;
  return incoming.revision > local.revision;
}

/** Construye la fila `documents` a partir de una entidad local. */
export function toDocument(householdId: string, entityType: string, entity: Entity): SyncDocument {
  return {
    household_id: householdId,
    entity_type: entityType,
    entity_id: entity.id,
    doc: entity,
    updated_at: entity.updatedAt,
    revision: entity.revision,
  };
}

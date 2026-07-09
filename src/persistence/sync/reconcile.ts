import type { Entity } from '@/domain/shared/entity';

/** Documento de sincronización tal y como se guarda en Firestore. */
export interface SyncDocument {
  entityType: string;
  entityId: string;
  doc: Entity;
  updatedAt: number;
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

/** Construye el documento de sincronización a partir de una entidad local. */
export function toDocument(entityType: string, entity: Entity): SyncDocument {
  return {
    entityType,
    entityId: entity.id,
    doc: entity,
    updatedAt: entity.updatedAt,
    revision: entity.revision,
  };
}

/** Id de documento estable a partir del tipo y el id de la entidad. */
export function docId(entityType: string, entityId: string): string {
  return `${entityType}__${entityId}`;
}

/**
 * Deriva el identificador de hogar (hex SHA-256) a partir de la clave secreta.
 * Es determinista e imposible de adivinar: quien no tenga la clave no puede
 * calcular el id y, por tanto, no accede a los datos del hogar.
 */
export async function householdIdFromKey(key: string): Promise<string> {
  const bytes = new TextEncoder().encode(key.trim());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

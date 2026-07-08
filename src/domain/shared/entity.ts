import type { Id } from './ids';
import type { Timestamp } from './time';

/** Identificador del hogar. Fijo a `local` hasta activar la sincronización. */
export const LOCAL_HOUSEHOLD_ID = 'local';

/**
 * Campos base de toda entidad persistida. Diseñados para soportar la
 * sincronización futura sin migraciones destructivas:
 *  - `householdId` aísla los datos por hogar.
 *  - `updatedAt` + `revision` permiten resolución de conflictos (last-write-wins).
 *  - `deletedAt` implementa borrado lógico (tombstone) para propagar borrados.
 */
export interface Entity {
  id: Id;
  householdId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
  revision: number;
}

/** Metadatos base para crear una entidad nueva. */
export function baseEntity(id: Id, now: Timestamp): Entity {
  return {
    id,
    householdId: LOCAL_HOUSEHOLD_ID,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    revision: 1,
  };
}

/** Devuelve los campos base actualizados tras una mutación. */
export function touch(entity: Entity, now: Timestamp): Pick<Entity, 'updatedAt' | 'revision'> {
  return {
    updatedAt: now,
    revision: entity.revision + 1,
  };
}

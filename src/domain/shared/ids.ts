import { ulid } from 'ulid';

/**
 * Identificadores de entidad.
 *
 * Usamos ULID (no autoincrement) porque:
 *  - Se generan offline sin colisiones entre dispositivos → sync futura sin reescribir.
 *  - Son ordenables lexicográficamente por tiempo de creación.
 */
export type Id = string;

/** Genera un nuevo identificador único de entidad. */
export function newId(): Id {
  return ulid();
}

/**
 * Tipo Result para modelar operaciones que pueden fallar sin lanzar excepciones
 * en la capa de dominio. La UI decide cómo presentar el error.
 */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

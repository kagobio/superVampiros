import type { Table } from 'dexie';
import type { Entity } from '@/domain/shared/entity';
import { touch } from '@/domain/shared/entity';
import type { Id } from '@/domain/shared/ids';
import type { Clock } from '@/domain/shared/time';
import { systemClock } from '@/domain/shared/time';

/**
 * Repositorio genérico para agregados que extienden `Entity`.
 *
 * Encapsula el acceso a Dexie tras una interfaz estable, aplica borrado lógico
 * (tombstones) y mantiene `updatedAt`/`revision` en cada mutación. La UI y los
 * servicios nunca tocan Dexie directamente: pasan siempre por aquí.
 */
export class BaseRepository<T extends Entity> {
  protected readonly table: Table<T, Id>;
  protected readonly clock: Clock;

  constructor(table: Table<T, Id>, clock: Clock = systemClock) {
    this.table = table;
    this.clock = clock;
  }

  /** Devuelve todas las entidades vivas (excluye tombstones). */
  async getAll(): Promise<T[]> {
    const rows = await this.table.toArray();
    return rows.filter((row) => row.deletedAt == null);
  }

  /** Devuelve una entidad viva por id, o `undefined`. */
  async getById(id: Id): Promise<T | undefined> {
    const row = await this.table.get(id);
    return row && row.deletedAt == null ? row : undefined;
  }

  /** Inserta una entidad ya construida (con sus campos base). */
  async create(entity: T): Promise<T> {
    await this.table.add(entity);
    return entity;
  }

  /** Aplica cambios parciales y actualiza `updatedAt`/`revision`. */
  async update(id: Id, changes: Partial<T>): Promise<T | undefined> {
    const current = await this.table.get(id);
    if (!current || current.deletedAt != null) return undefined;
    const next = { ...current, ...changes, ...touch(current, this.clock.now()) } as T;
    await this.table.put(next);
    return next;
  }

  /** Borrado lógico: marca `deletedAt` para permitir la sync futura. */
  async softDelete(id: Id): Promise<void> {
    const current = await this.table.get(id);
    if (!current || current.deletedAt != null) return;
    const now = this.clock.now();
    await this.table.put({ ...current, deletedAt: now, ...touch(current, now) } as T);
  }

  /** Revierte un borrado lógico (deshacer): limpia `deletedAt` y propaga la sync. */
  async restore(id: Id): Promise<T | undefined> {
    const current = await this.table.get(id);
    if (!current) return undefined;
    const now = this.clock.now();
    const next = { ...current, deletedAt: null, ...touch(current, now) } as T;
    await this.table.put(next);
    return next;
  }
}

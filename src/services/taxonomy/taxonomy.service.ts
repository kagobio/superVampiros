import type { Table } from 'dexie';
import { db } from '@/persistence/db';
import { baseEntity, type Entity } from '@/domain/shared/entity';
import { newId, type Id } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import { BaseRepository } from '@/persistence/repositories/base-repository';
import { historyService } from '@/services/history/history.service';
import type { EntityType } from '@/domain/history/history.types';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';
import type { Unit } from '@/domain/unit/unit.types';
import type { Tag } from '@/domain/tag/tag.types';

/** Cualquier taxonomía tiene nombre y, opcionalmente, un orden manual. */
type Taxonomy = Entity & { name: string; order?: number };

/** Campos que aporta quien crea la entidad (sin metadatos base ni `order`). */
type CreateFields<T extends Taxonomy> = Omit<T, keyof Entity | 'order'>;

/**
 * Servicio genérico para las taxonomías configurables. Ofrece CRUD + reorder y
 * registra los cambios en el historial. Evita duplicar la misma lógica en
 * categorías, ubicaciones, unidades y etiquetas.
 */
export class TaxonomyService<T extends Taxonomy> {
  private readonly repo: BaseRepository<T>;
  private readonly entityType: EntityType;
  private readonly ordered: boolean;
  private readonly clock: Clock;

  constructor(
    table: Table<T, Id>,
    entityType: EntityType,
    ordered: boolean,
    clock: Clock = systemClock,
  ) {
    this.repo = new BaseRepository<T>(table, clock);
    this.entityType = entityType;
    this.ordered = ordered;
    this.clock = clock;
  }

  /** Lista viva, ordenada por `order` (si aplica) o por nombre. */
  async list(): Promise<T[]> {
    const rows = await this.repo.getAll();
    if (this.ordered) {
      return rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }

  async create(fields: CreateFields<T>): Promise<T> {
    const now = this.clock.now();
    const order = this.ordered ? (await this.repo.getAll()).length : undefined;
    const entity = { ...baseEntity(newId(), now), ...fields, order } as unknown as T;
    await this.repo.create(entity);
    await historyService.record('create', this.entityType, entity.id, { name: entity.name });
    return entity;
  }

  async update(id: Id, changes: Partial<T>): Promise<T | undefined> {
    return this.repo.update(id, changes);
  }

  async remove(id: Id): Promise<void> {
    await this.repo.softDelete(id);
    await historyService.record('delete', this.entityType, id, {});
  }

  /** Reasigna `order` según la posición en el array recibido. */
  async reorder(ids: Id[]): Promise<void> {
    await Promise.all(ids.map((id, index) => this.repo.update(id, { order: index } as Partial<T>)));
  }
}

export const categoryService = new TaxonomyService<Category>(db.categories, 'category', true);
export const locationService = new TaxonomyService<Location>(db.locations, 'location', true);
export const unitService = new TaxonomyService<Unit>(db.units, 'unit', true);
export const tagService = new TaxonomyService<Tag>(db.tags, 'tag', false);

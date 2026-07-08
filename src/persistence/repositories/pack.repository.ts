import { db } from '@/persistence/db';
import type { Pack } from '@/domain/pack/pack.types';
import { BaseRepository } from './base-repository';

/** Repositorio de packs. */
export class PackRepository extends BaseRepository<Pack> {
  constructor() {
    super(db.packs);
  }

  /** Packs vivos ordenados por nombre. */
  async listAll(): Promise<Pack[]> {
    const rows = await this.getAll();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }
}

export const packRepository = new PackRepository();

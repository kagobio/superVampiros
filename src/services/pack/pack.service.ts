import { packRepository, type PackRepository } from '@/persistence/repositories/pack.repository';
import { inventoryService, type InventoryService } from '@/services/inventory/inventory.service';
import { historyService, type HistoryService } from '@/services/history/history.service';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import type { Pack, PackItem } from '@/domain/pack/pack.types';

export interface NewPackInput {
  name: string;
  items?: PackItem[];
}

/**
 * Casos de uso de packs. La acción estrella es `apply`: suma al inventario la
 * cantidad de cada línea (repone stock + registra la compra) y registra un
 * evento `pack_apply`.
 */
export class PackService {
  private readonly repo: PackRepository;
  private readonly inventory: InventoryService;
  private readonly history: HistoryService;
  private readonly clock: Clock;

  constructor(
    repo: PackRepository = packRepository,
    inventory: InventoryService = inventoryService,
    history: HistoryService = historyService,
    clock: Clock = systemClock,
  ) {
    this.repo = repo;
    this.inventory = inventory;
    this.history = history;
    this.clock = clock;
  }

  async create(input: NewPackInput): Promise<Pack> {
    const pack: Pack = {
      ...baseEntity(newId(), this.clock.now()),
      name: input.name.trim(),
      items: input.items ?? [],
    };
    await this.repo.create(pack);
    await this.history.record('create', 'pack', pack.id, { name: pack.name });
    return pack;
  }

  async update(id: string, changes: Partial<Pack>): Promise<Pack | undefined> {
    return this.repo.update(id, changes);
  }

  async remove(id: string): Promise<void> {
    const pack = await this.repo.getById(id);
    await this.repo.softDelete(id);
    if (pack) await this.history.record('delete', 'pack', id, { name: pack.name });
  }

  /** "Añadir pack": suma cada línea al inventario y registra la aplicación. */
  async apply(id: string): Promise<boolean> {
    const pack = await this.repo.getById(id);
    if (!pack) return false;
    for (const item of pack.items) {
      await this.inventory.restock(item.productId, item.quantity);
    }
    await this.history.record('pack_apply', 'pack', id, { name: pack.name });
    return true;
  }
}

export const packService = new PackService();

import {
  shoppingRepository,
  type ShoppingRepository,
} from '@/persistence/repositories/shopping.repository';
import { inventoryService, type InventoryService } from '@/services/inventory/inventory.service';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';

export interface NewManualItemInput {
  name: string;
  quantity?: number | null;
  unitId?: string | null;
  categoryId?: string | null;
  productId?: string | null;
}

/**
 * Casos de uso de la lista de la compra.
 *
 * La sección automática (productos bajo mínimo) NO vive aquí: se deriva en la UI
 * a partir del inventario, de modo que aparece/desaparece sola y nunca se
 * desincroniza. Este servicio gestiona los elementos manuales y el "comprado".
 */
export class ShoppingListService {
  private readonly repo: ShoppingRepository;
  private readonly inventory: InventoryService;
  private readonly clock: Clock;

  constructor(
    repo: ShoppingRepository = shoppingRepository,
    inventory: InventoryService = inventoryService,
    clock: Clock = systemClock,
  ) {
    this.repo = repo;
    this.inventory = inventory;
    this.clock = clock;
  }

  /** Añade un elemento manual a la lista. */
  async addManual(input: NewManualItemInput): Promise<ShoppingListItem> {
    const item: ShoppingListItem = {
      ...baseEntity(newId(), this.clock.now()),
      productId: input.productId ?? null,
      name: input.name.trim(),
      quantity: input.quantity ?? null,
      unitId: input.unitId ?? null,
      categoryId: input.categoryId ?? null,
      checked: false,
      source: 'manual',
    };
    await this.repo.create(item);
    return item;
  }

  /** Marca/desmarca un elemento manual como comprado. */
  async toggleChecked(id: string): Promise<ShoppingListItem | undefined> {
    const item = await this.repo.getById(id);
    if (!item) return undefined;
    return this.repo.update(id, { checked: !item.checked });
  }

  /** Elimina un elemento manual. */
  async removeManual(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  /** Elimina todos los elementos manuales ya marcados. */
  async clearChecked(): Promise<void> {
    const items = await this.repo.listManual();
    await Promise.all(items.filter((i) => i.checked).map((i) => this.repo.softDelete(i.id)));
  }

  /**
   * Marca un producto automático como comprado: repone su stock (por encima del
   * mínimo), con lo que desaparece de la lista automática.
   */
  async buyProduct(productId: string, addQuantity?: number): Promise<void> {
    await this.inventory.restock(productId, addQuantity);
  }
}

export const shoppingListService = new ShoppingListService();

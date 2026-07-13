import {
  productRepository,
  type ProductRepository,
} from '@/persistence/repositories/product.repository';
import { buildProduct, type ProductFields } from '@/domain/product/product.factory';
import type { NewProductInput, Product } from '@/domain/product/product.types';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import { DEFAULT_PRODUCT_COLOR } from '@/config/constants';
import { round2 } from '@/lib/money';
import { historyService, type HistoryService } from '@/services/history/history.service';

/**
 * Casos de uso del inventario. Es el único punto por el que la UI muta productos:
 * orquesta dominio + repositorio y registra cada cambio en el historial (event log).
 */
export class InventoryService {
  private readonly repo: ProductRepository;
  private readonly history: HistoryService;
  private readonly clock: Clock;

  constructor(
    repo: ProductRepository = productRepository,
    history: HistoryService = historyService,
    clock: Clock = systemClock,
  ) {
    this.repo = repo;
    this.history = history;
    this.clock = clock;
  }

  /** Crea un producto aplicando los valores por defecto. */
  async create(input: NewProductInput): Promise<Product> {
    const fields: ProductFields = {
      name: input.name,
      categoryId: input.categoryId ?? null,
      locationId: input.locationId ?? null,
      quantity: input.quantity ?? 0,
      unitId: input.unitId ?? null,
      minStock: input.minStock ?? 0,
      favorite: input.favorite ?? false,
      expiryDate: input.expiryDate ?? null,
      notes: input.notes ?? '',
      icon: input.icon ?? '',
      color: input.color ?? DEFAULT_PRODUCT_COLOR,
      tagIds: input.tagIds ?? [],
      barcode: input.barcode ?? null,
      price: input.price ?? null,
    };
    const product = buildProduct(newId(), this.clock.now(), fields);
    await this.repo.create(product);
    await this.history.record('create', 'product', product.id, { name: product.name });
    return product;
  }

  /** Devuelve un producto vivo por id. */
  async get(id: string): Promise<Product | undefined> {
    return this.repo.getById(id);
  }

  /** Devuelve un producto vivo por su código de barras. */
  async getByBarcode(barcode: string): Promise<Product | undefined> {
    return this.repo.findByBarcode(barcode);
  }

  /** Actualiza campos editables de un producto. */
  async update(id: string, changes: Partial<Product>): Promise<Product | undefined> {
    const next = await this.repo.update(id, changes);
    if (next) await this.history.record('update', 'product', id, { name: next.name });
    return next;
  }

  /** Borrado lógico. */
  async remove(id: string): Promise<void> {
    const product = await this.repo.getById(id);
    await this.repo.softDelete(id);
    if (product) await this.history.record('delete', 'product', id, { name: product.name });
  }

  /** Deshace un borrado (restaura el producto tal cual estaba). */
  async restore(id: string): Promise<Product | undefined> {
    const next = await this.repo.restore(id);
    if (next) await this.history.record('update', 'product', id, { name: next.name });
    return next;
  }

  /** Aplica los mismos cambios a varios productos (edición en lote). */
  async updateMany(ids: string[], changes: Partial<Product>): Promise<void> {
    for (const id of ids) {
      await this.update(id, changes);
    }
  }

  /**
   * Ajusta la cantidad en `delta` (p. ej. +1 / −1 desde el Stepper). Nunca baja
   * de 0. Registra un evento de consumo o de compra según el signo.
   */
  async adjustQuantity(id: string, delta: number): Promise<Product | undefined> {
    const product = await this.repo.getById(id);
    if (!product) return undefined;
    const quantity = Math.max(0, product.quantity + delta);
    if (quantity === product.quantity) return product;
    const next = await this.repo.update(id, { quantity });
    if (next) {
      const isPurchase = delta > 0;
      // Coste de la compra (para el gasto mensual), solo si hay precio.
      const cost = isPurchase && product.price != null ? round2(product.price * delta) : undefined;
      await this.history.record(isPurchase ? 'purchase' : 'consume', 'product', id, {
        name: next.name,
        delta,
        quantity,
        ...(cost != null ? { cost } : {}),
      });
    }
    return next;
  }

  /** Fija la cantidad a un valor absoluto (no negativo). */
  async setQuantity(id: string, quantity: number): Promise<Product | undefined> {
    return this.update(id, { quantity: Math.max(0, quantity) });
  }

  /**
   * Consume hasta `amount` unidades de un producto sin bajar de 0. Registra el
   * consumo REAL (no el solicitado). Lo usa "He cocinado" al descontar recetas.
   */
  async consume(id: string, amount: number): Promise<Product | undefined> {
    const product = await this.repo.getById(id);
    if (!product) return undefined;
    const actual = Math.min(Math.max(amount, 0), product.quantity);
    if (actual <= 0) return product;
    const next = await this.repo.update(id, { quantity: product.quantity - actual });
    if (next) {
      await this.history.record('consume', 'product', id, {
        name: next.name,
        delta: -actual,
        quantity: next.quantity,
      });
    }
    return next;
  }

  /** Alterna el estado de favorito. */
  async toggleFavorite(id: string): Promise<Product | undefined> {
    const product = await this.repo.getById(id);
    if (!product) return undefined;
    return this.repo.update(id, { favorite: !product.favorite });
  }

  /**
   * Repone un producto (marcar "comprado" en la lista de la compra). Suma
   * `addQuantity` unidades (por defecto, las necesarias para superar el stock
   * mínimo, mínimo 1), actualiza `lastPurchaseAt` y registra la compra. Así el
   * producto deja de estar "por reponer" automáticamente.
   */
  async restock(id: string, addQuantity?: number): Promise<Product | undefined> {
    const product = await this.repo.getById(id);
    if (!product) return undefined;
    const shortfall = Math.max(product.minStock - product.quantity, 1);
    const add = Math.max(addQuantity ?? shortfall, 1);
    const now = this.clock.now();
    const next = await this.repo.update(id, {
      quantity: product.quantity + add,
      lastPurchaseAt: now,
    });
    if (next) {
      const cost = product.price != null ? round2(product.price * add) : undefined;
      await this.history.record('purchase', 'product', id, {
        name: next.name,
        delta: add,
        quantity: next.quantity,
        ...(cost != null ? { cost } : {}),
      });
    }
    return next;
  }
}

export const inventoryService = new InventoryService();

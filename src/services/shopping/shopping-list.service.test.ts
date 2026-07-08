import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { InventoryService } from '@/services/inventory/inventory.service';
import { needsRestock } from '@/domain/product/product.rules';
import { ShoppingListService } from './shopping-list.service';

const inventory = new InventoryService();
const shopping = new ShoppingListService();

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.shoppingItems.clear(), db.history.clear()]);
});

describe('ShoppingListService — elementos manuales', () => {
  it('añade, marca y limpia elementos manuales', async () => {
    const item = await shopping.addManual({ name: '  Pan  ' });
    expect(item.name).toBe('Pan');
    expect(item.source).toBe('manual');
    expect(item.checked).toBe(false);

    const toggled = await shopping.toggleChecked(item.id);
    expect(toggled?.checked).toBe(true);

    await shopping.clearChecked();
    const stored = await db.shoppingItems.get(item.id);
    expect(stored?.deletedAt).not.toBeNull();
  });

  it('elimina un elemento manual (tombstone)', async () => {
    const item = await shopping.addManual({ name: 'Sal' });
    await shopping.removeManual(item.id);
    const stored = await db.shoppingItems.get(item.id);
    expect(stored?.deletedAt).not.toBeNull();
  });
});

describe('ShoppingListService — comprar producto automático', () => {
  it('repone por encima del mínimo y deja de necesitar reposición', async () => {
    const p = await inventory.create({ name: 'Leche', quantity: 0, minStock: 3 });
    expect(needsRestock(p)).toBe(true);

    await shopping.buyProduct(p.id);

    const restocked = await db.products.get(p.id);
    expect(restocked!.quantity).toBeGreaterThanOrEqual(3);
    expect(needsRestock(restocked!)).toBe(false);
    expect(restocked!.lastPurchaseAt).not.toBeNull();

    const purchases = (await db.history.toArray()).filter((e) => e.type === 'purchase');
    expect(purchases.length).toBeGreaterThanOrEqual(1);
  });
});

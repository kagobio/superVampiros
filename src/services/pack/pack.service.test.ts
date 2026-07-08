import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { InventoryService } from '@/services/inventory/inventory.service';
import { PackService } from './pack.service';

const inventory = new InventoryService();
const packs = new PackService();

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.packs.clear(), db.history.clear()]);
});

describe('PackService.apply', () => {
  it('suma cada línea al inventario y registra la aplicación', async () => {
    const leche = await inventory.create({ name: 'Leche', quantity: 0 });
    const arroz = await inventory.create({ name: 'Arroz', quantity: 2 });

    const pack = await packs.create({
      name: 'Compra semanal',
      items: [
        { productId: leche.id, quantity: 6, unitId: null },
        { productId: arroz.id, quantity: 2, unitId: null },
      ],
    });

    const ok = await packs.apply(pack.id);
    expect(ok).toBe(true);

    expect((await db.products.get(leche.id))!.quantity).toBe(6);
    expect((await db.products.get(arroz.id))!.quantity).toBe(4);
    expect((await db.products.get(leche.id))!.lastPurchaseAt).not.toBeNull();

    const types = (await db.history.toArray()).map((e) => e.type);
    expect(types).toContain('pack_apply');
    expect(types.filter((t) => t === 'purchase').length).toBe(2);
  });
});

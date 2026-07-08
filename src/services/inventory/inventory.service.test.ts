import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { InventoryService } from './inventory.service';

const service = new InventoryService();

async function clearDb() {
  await Promise.all([db.products.clear(), db.history.clear()]);
}

describe('InventoryService', () => {
  beforeEach(clearDb);

  it('crea un producto con valores por defecto y registra el evento', async () => {
    const product = await service.create({ name: '  Leche  ' });
    expect(product.name).toBe('Leche'); // recorta espacios
    expect(product.quantity).toBe(0);
    expect(product.deletedAt).toBeNull();

    const stored = await db.products.get(product.id);
    expect(stored).toBeDefined();

    const events = await db.history.toArray();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('create');
  });

  it('ajusta la cantidad sin bajar de cero y registra consumo/compra', async () => {
    const p = await service.create({ name: 'Huevos', quantity: 2 });

    const after = await service.adjustQuantity(p.id, -1);
    expect(after?.quantity).toBe(1);

    const clamped = await service.adjustQuantity(p.id, -5);
    expect(clamped?.quantity).toBe(0);

    const back = await service.adjustQuantity(p.id, 3);
    expect(back?.quantity).toBe(3);

    const types = (await db.history.toArray()).map((e) => e.type);
    expect(types).toContain('consume');
    expect(types).toContain('purchase');
  });

  it('no genera evento si el delta no cambia la cantidad (ya en 0)', async () => {
    const p = await service.create({ name: 'Sal', quantity: 0 });
    await db.history.clear();
    const res = await service.adjustQuantity(p.id, -1);
    expect(res?.quantity).toBe(0);
    expect(await db.history.count()).toBe(0);
  });

  it('alterna favorito', async () => {
    const p = await service.create({ name: 'Café', favorite: false });
    const fav = await service.toggleFavorite(p.id);
    expect(fav?.favorite).toBe(true);
  });

  it('borra de forma lógica (tombstone) y deja de listarse', async () => {
    const p = await service.create({ name: 'Atún' });
    await service.remove(p.id);
    const stored = await db.products.get(p.id);
    expect(stored?.deletedAt).not.toBeNull();
  });
});

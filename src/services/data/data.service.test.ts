import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { InventoryService } from '@/services/inventory/inventory.service';
import { categoryService } from '@/services/taxonomy/taxonomy.service';
import { exportJson } from './export.service';
import { importJson, importProductsCsv } from './import.service';

const inventory = new InventoryService();

async function clearAll() {
  await Promise.all([
    db.products.clear(),
    db.categories.clear(),
    db.locations.clear(),
    db.units.clear(),
    db.tags.clear(),
    db.shoppingItems.clear(),
    db.recipes.clear(),
    db.packs.clear(),
    db.history.clear(),
    db.settings.clear(),
  ]);
}

beforeEach(clearAll);

describe('exportJson / importJson', () => {
  it('hace round-trip: exportar, borrar e importar restaura los datos', async () => {
    const cat = await categoryService.create({ name: 'Despensa', icon: 'tag', color: '#000' });
    await inventory.create({ name: 'Arroz', quantity: 3, categoryId: cat.id });

    const json = await exportJson();
    await clearAll();
    expect(await db.products.count()).toBe(0);

    const res = await importJson(json);
    expect(res.ok).toBe(true);
    expect(await db.products.count()).toBe(1);
    expect(await db.categories.count()).toBe(1);
    const restored = (await db.products.toArray())[0];
    expect(restored?.name).toBe('Arroz');
  });

  it('respeta last-write-wins: un backup más antiguo no pisa cambios más nuevos', async () => {
    const p = await inventory.create({ name: 'Leche', quantity: 5 });
    const json = await exportJson();

    // El estado local avanza (updatedAt mayor).
    await db.products.update(p.id, {
      quantity: 9,
      updatedAt: p.updatedAt + 10_000,
      revision: p.revision + 1,
    });

    const res = await importJson(json);
    expect(res.ok).toBe(true);
    expect((await db.products.get(p.id))!.quantity).toBe(9); // el local (más nuevo) gana
  });

  it('rechaza un archivo que no es del formato', async () => {
    const res = await importJson(JSON.stringify({ foo: 'bar' }));
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
});

describe('importProductsCsv', () => {
  it('crea productos y taxonomías por nombre', async () => {
    const csv = 'nombre,cantidad,categoria,unidad\nGalletas,3,Dulces,paquetes';
    const res = await importProductsCsv(csv);
    expect(res.ok).toBe(true);
    expect(res.changed).toBe(1);

    const products = await db.products.toArray();
    expect(products[0]?.name).toBe('Galletas');
    expect(products[0]?.quantity).toBe(3);
    expect((await db.categories.toArray()).some((c) => c.name === 'Dulces')).toBe(true);
  });

  it('actualiza el producto si ya existe (por nombre)', async () => {
    await inventory.create({ name: 'Café', quantity: 1 });
    const res = await importProductsCsv('nombre,cantidad\nCafé,7');
    expect(res.changed).toBe(1);
    const cafe = (await db.products.toArray()).find((p) => p.name === 'Café');
    expect(cafe?.quantity).toBe(7);
    expect(await db.products.count()).toBe(1); // no duplica
  });
});

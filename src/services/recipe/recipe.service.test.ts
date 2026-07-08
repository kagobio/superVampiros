import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { InventoryService } from '@/services/inventory/inventory.service';
import { RecipeService } from './recipe.service';

const inventory = new InventoryService();
const recipes = new RecipeService();

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.recipes.clear(), db.history.clear()]);
});

describe('RecipeService.cook', () => {
  it('descuenta ingredientes, no baja de 0 y avisa de faltantes', async () => {
    const harina = await inventory.create({ name: 'Harina', quantity: 5 });
    const huevos = await inventory.create({ name: 'Huevos', quantity: 1 });

    const recipe = await recipes.create({
      name: 'Tortitas',
      ingredients: [
        { productId: harina.id, quantity: 2, unitId: null },
        { productId: huevos.id, quantity: 3, unitId: null },
      ],
    });

    const result = await recipes.cook(recipe.id);

    expect(result.ok).toBe(true);
    expect(result.shortages.map((s) => s.productId)).toEqual([huevos.id]);

    expect((await db.products.get(harina.id))!.quantity).toBe(3);
    expect((await db.products.get(huevos.id))!.quantity).toBe(0);

    const types = (await db.history.toArray()).map((e) => e.type);
    expect(types).toContain('cook');
    expect(types.filter((t) => t === 'consume').length).toBe(2);
  });

  it('registra el consumo real, no el solicitado', async () => {
    const p = await inventory.create({ name: 'Leche', quantity: 1 });
    const recipe = await recipes.create({
      name: 'Batido',
      ingredients: [{ productId: p.id, quantity: 5, unitId: null }],
    });
    await recipes.cook(recipe.id);
    const consume = (await db.history.toArray()).find((e) => e.type === 'consume');
    expect(consume?.payload.delta).toBe(-1); // solo había 1
  });
});

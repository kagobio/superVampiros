import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/persistence/db';
import { MealPlanService } from './meal-plan.service';

const plans = new MealPlanService();

beforeEach(async () => {
  await Promise.all([db.mealPlans.clear(), db.history.clear()]);
});

describe('MealPlanService', () => {
  it('crea un menú con sus entradas y registra el evento', async () => {
    const plan = await plans.create({
      name: 'Semana tipo',
      entries: [{ day: 0, slot: 'lunch', recipeId: 'r1' }],
    });

    expect(plan.entries).toHaveLength(1);
    const stored = await db.mealPlans.get(plan.id);
    expect(stored?.name).toBe('Semana tipo');

    const types = (await db.history.toArray()).map((e) => e.type);
    expect(types).toContain('create');
  });

  it('actualiza las entradas del menú', async () => {
    const plan = await plans.create({ name: 'Menú' });
    await plans.update(plan.id, {
      entries: [{ day: 2, slot: 'dinner', recipeId: 'r2' }],
    });
    const stored = await db.mealPlans.get(plan.id);
    expect(stored?.entries).toEqual([{ day: 2, slot: 'dinner', recipeId: 'r2' }]);
  });

  it('borra (lógicamente) el menú y registra el evento', async () => {
    const plan = await plans.create({ name: 'Temporal' });
    await plans.remove(plan.id);

    expect(await db.mealPlans.count()).toBe(1); // sigue como tombstone
    expect((await db.mealPlans.get(plan.id))?.deletedAt).not.toBeNull();
    const types = (await db.history.toArray()).map((e) => e.type);
    expect(types).toContain('delete');
  });
});

import {
  recipeRepository,
  type RecipeRepository,
} from '@/persistence/repositories/recipe.repository';
import { inventoryService, type InventoryService } from '@/services/inventory/inventory.service';
import { historyService, type HistoryService } from '@/services/history/history.service';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import type { Recipe, RecipeIngredient } from '@/domain/recipe/recipe.types';

export interface NewRecipeInput {
  name: string;
  description?: string;
  servings?: number | null;
  ingredients?: RecipeIngredient[];
}

/**
 * Casos de uso de recetas. La acción estrella es `cook`: descuenta del
 * inventario la cantidad de cada ingrediente (consumo real, sin bajar de 0) y
 * registra un evento `cook`.
 */
export class RecipeService {
  private readonly repo: RecipeRepository;
  private readonly inventory: InventoryService;
  private readonly history: HistoryService;
  private readonly clock: Clock;

  constructor(
    repo: RecipeRepository = recipeRepository,
    inventory: InventoryService = inventoryService,
    history: HistoryService = historyService,
    clock: Clock = systemClock,
  ) {
    this.repo = repo;
    this.inventory = inventory;
    this.history = history;
    this.clock = clock;
  }

  async create(input: NewRecipeInput): Promise<Recipe> {
    const recipe: Recipe = {
      ...baseEntity(newId(), this.clock.now()),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      servings: input.servings ?? null,
      ingredients: input.ingredients ?? [],
    };
    await this.repo.create(recipe);
    await this.history.record('create', 'recipe', recipe.id, { name: recipe.name });
    return recipe;
  }

  async update(id: string, changes: Partial<Recipe>): Promise<Recipe | undefined> {
    return this.repo.update(id, changes);
  }

  async remove(id: string): Promise<void> {
    const recipe = await this.repo.getById(id);
    await this.repo.softDelete(id);
    if (recipe) await this.history.record('delete', 'recipe', id, { name: recipe.name });
  }

  /**
   * "He cocinado": descuenta cada ingrediente del inventario y registra la
   * preparación. Devuelve los ingredientes cuyo stock era insuficiente (para
   * avisar en la UI), aunque la operación se completa igualmente.
   */
  async cook(id: string): Promise<{ ok: boolean; shortages: RecipeIngredient[] }> {
    const recipe = await this.repo.getById(id);
    if (!recipe) return { ok: false, shortages: [] };

    const shortages: RecipeIngredient[] = [];
    for (const ingredient of recipe.ingredients) {
      const before = await this.inventory.get(ingredient.productId);
      if (!before || before.quantity < ingredient.quantity) shortages.push(ingredient);
      await this.inventory.consume(ingredient.productId, ingredient.quantity);
    }

    await this.history.record('cook', 'recipe', id, { name: recipe.name });
    return { ok: true, shortages };
  }
}

export const recipeService = new RecipeService();

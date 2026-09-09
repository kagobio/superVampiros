import {
  mealPlanRepository,
  type MealPlanRepository,
} from '@/persistence/repositories/meal-plan.repository';
import { historyService, type HistoryService } from '@/services/history/history.service';
import { baseEntity } from '@/domain/shared/entity';
import { newId } from '@/domain/shared/ids';
import { systemClock, type Clock } from '@/domain/shared/time';
import type { MealPlan, MealPlanEntry } from '@/domain/meal-plan/meal-plan.types';

export interface NewMealPlanInput {
  name: string;
  entries?: MealPlanEntry[];
}

/**
 * Casos de uso de menús semanales. Un menú es un conjunto de recetas asignadas a
 * los huecos comida/cena de la semana; los ingredientes se derivan (sin
 * persistir) a partir de las recetas planificadas.
 */
export class MealPlanService {
  private readonly repo: MealPlanRepository;
  private readonly history: HistoryService;
  private readonly clock: Clock;

  constructor(
    repo: MealPlanRepository = mealPlanRepository,
    history: HistoryService = historyService,
    clock: Clock = systemClock,
  ) {
    this.repo = repo;
    this.history = history;
    this.clock = clock;
  }

  async create(input: NewMealPlanInput): Promise<MealPlan> {
    const plan: MealPlan = {
      ...baseEntity(newId(), this.clock.now()),
      name: input.name.trim(),
      entries: input.entries ?? [],
    };
    await this.repo.create(plan);
    await this.history.record('create', 'mealPlan', plan.id, { name: plan.name });
    return plan;
  }

  async update(id: string, changes: Partial<MealPlan>): Promise<MealPlan | undefined> {
    return this.repo.update(id, changes);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.repo.getById(id);
    await this.repo.softDelete(id);
    if (plan) await this.history.record('delete', 'mealPlan', id, { name: plan.name });
  }
}

export const mealPlanService = new MealPlanService();

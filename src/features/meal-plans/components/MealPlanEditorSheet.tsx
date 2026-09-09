import { useMemo, useState } from 'react';
import { Copy, Trash2, UtensilsCrossed } from 'lucide-react';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';
import {
  MEAL_SLOTS,
  WEEK_DAYS,
  aggregatePlanIngredients,
  entriesToMap,
  mapToEntries,
  slotKey,
} from '@/domain/meal-plan/meal-plan.rules';
import { mealPlanService } from '@/services/meal-plan/meal-plan.service';
import { toast } from '@/stores/toast.store';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useUnits } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useRecipes } from '@/features/recipes/hooks/useRecipes';

interface MealPlanEditorSheetProps {
  open: boolean;
  onClose: () => void;
  plan: MealPlan | null;
}

export function MealPlanEditorSheet({ open, onClose, plan }: MealPlanEditorSheetProps) {
  const recipes = useRecipes();
  const products = useProducts();
  const units = useUnits();

  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u.abbreviation])), [units]);

  // El padre remonta este componente (vía `key`) en cada apertura, así que
  // basta con inicializar el estado desde el menú, sin efectos de sincronización.
  const [name, setName] = useState(plan?.name ?? '');
  // Asignaciones por hueco: `slotKey → recipeId`.
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(entriesToMap(plan?.entries ?? [])),
  );

  const isEdit = plan !== null;

  const setSlot = (day: number, slot: (typeof MEAL_SLOTS)[number]['slot'], recipeId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (recipeId) next[slotKey(day, slot)] = recipeId;
      else delete next[slotKey(day, slot)];
      return next;
    });
  };

  // Ingredientes derivados en vivo de las recetas asignadas al menú.
  const ingredients = useMemo(() => {
    const entries = mapToEntries(new Map(Object.entries(assignments)));
    const draft: MealPlan = {
      id: plan?.id ?? 'draft',
      householdId: 'local',
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
      revision: 0,
      name,
      entries,
    };
    return aggregatePlanIngredients(draft, recipesById)
      .map((i) => ({
        name: productById.get(i.productId)?.name ?? 'Producto eliminado',
        quantity: i.quantity,
        unit: i.unitId ? (unitById.get(i.unitId) ?? '') : '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [assignments, name, plan?.id, recipesById, productById, unitById]);

  const plannedCount = Object.keys(assignments).length;

  const handleSave = async () => {
    if (!name.trim()) return;
    const entries = mapToEntries(new Map(Object.entries(assignments)));
    if (isEdit) await mealPlanService.update(plan.id, { name, entries });
    else await mealPlanService.create({ name, entries });
    onClose();
  };

  const handleDelete = async () => {
    if (plan) {
      await mealPlanService.remove(plan.id);
      onClose();
    }
  };

  const copyIngredients = async () => {
    const text = ingredients
      .map((i) => `- ${i.name}${i.quantity ? ` ×${i.quantity}${i.unit ? ` ${i.unit}` : ''}` : ''}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast('Lista de ingredientes copiada', 'success');
    } catch {
      toast('No se pudo copiar', 'warning');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar menú' : 'Nuevo menú semanal'}
      footer={
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Button variant="ghost" onClick={handleDelete} className="text-danger">
              <Trash2 size={18} aria-hidden="true" />
              Eliminar
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={!name.trim()} className="ml-auto">
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          {({ id }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Semana normal"
              autoFocus
            />
          )}
        </Field>

        {recipes.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
            Primero crea recetas para poder planificar el menú.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text">Menú de la semana</p>
            {WEEK_DAYS.map((dayLabel, day) => (
              <div key={dayLabel} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="mb-2 text-sm font-medium text-text">{dayLabel}</p>
                <div className="space-y-2">
                  {MEAL_SLOTS.map(({ slot, label }) => (
                    <div key={slot} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-muted">
                        {label}
                      </span>
                      <Select
                        aria-label={`${label} del ${dayLabel}`}
                        value={assignments[slotKey(day, slot)] ?? ''}
                        onChange={(e) => setSlot(day, slot, e.target.value)}
                      >
                        <option value="">—</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <UtensilsCrossed size={15} className="text-primary" aria-hidden="true" />
              Ingredientes necesarios
              <span className="text-muted">· {ingredients.length}</span>
            </p>
            {ingredients.length > 0 ? (
              <button
                type="button"
                onClick={copyIngredients}
                className="flex items-center gap-1 text-xs text-muted hover:text-text"
              >
                <Copy size={13} aria-hidden="true" />
                Copiar
              </button>
            ) : null}
          </div>
          {ingredients.length === 0 ? (
            <p className="text-xs text-muted">
              Asigna recetas a los días y aquí aparecerán, sumados, todos los ingredientes.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {ingredients.map((i) => (
                <li
                  key={`${i.name}-${i.unit}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-text">{i.name}</span>
                  {i.quantity ? (
                    <span className="shrink-0 text-muted">
                      ×{i.quantity}
                      {i.unit ? ` ${i.unit}` : ''}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {plannedCount > 0 ? (
          <p className="text-xs text-muted">
            {plannedCount} comida{plannedCount === 1 ? '' : 's'} planificada
            {plannedCount === 1 ? '' : 's'}.
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

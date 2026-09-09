import { useMemo, useState } from 'react';
import { Copy, ShoppingCart, Trash2, UtensilsCrossed } from 'lucide-react';
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
import { shoppingListService } from '@/services/shopping/shopping-list.service';
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

  // Ingredientes derivados en vivo de las recetas asignadas al menú, con el
  // stock actual y lo que falta comprar de cada uno.
  const rows = useMemo(() => {
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
    const aggregated = aggregatePlanIngredients(draft, recipesById);
    return aggregated
      .map((i) => {
        const product = productById.get(i.productId);
        const available = product?.quantity ?? 0;
        return {
          productId: i.productId,
          name: product?.name ?? 'Producto eliminado',
          needed: i.quantity,
          available,
          missing: Math.max(i.quantity - available, 0),
          unitId: i.unitId,
          unit: i.unitId ? (unitById.get(i.unitId) ?? '') : '',
          categoryId: product?.categoryId ?? null,
          exists: Boolean(product),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [assignments, name, plan?.id, recipesById, productById, unitById]);

  const missingRows = rows.filter((r) => r.exists && r.missing > 0);
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
    const text = rows
      .map((i) => `- ${i.name}${i.needed ? ` ×${i.needed}${i.unit ? ` ${i.unit}` : ''}` : ''}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast('Lista de ingredientes copiada', 'success');
    } catch {
      toast('No se pudo copiar', 'warning');
    }
  };

  const addMissingToShoppingList = async () => {
    const created = await shoppingListService.addMissingFromMenu(
      missingRows.map((r) => ({
        name: r.name,
        quantity: r.missing,
        unitId: r.unitId,
        categoryId: r.categoryId,
        productId: r.productId,
      })),
    );
    toast(
      created > 0
        ? `${created} producto${created === 1 ? '' : 's'} añadido${created === 1 ? '' : 's'} a la compra`
        : 'La lista ya tenía lo que falta',
      'success',
    );
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
              <span className="text-muted">· {rows.length}</span>
            </p>
            {rows.length > 0 ? (
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
          {rows.length === 0 ? (
            <p className="text-xs text-muted">
              Asigna recetas a los días y aquí aparecerán, sumados, todos los ingredientes.
            </p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {rows.map((i) => (
                  <li
                    key={`${i.productId}-${i.unit}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-text">{i.name}</span>
                      {i.exists ? (
                        <span className="text-xs text-muted">
                          tienes {i.available}
                          {i.missing > 0 ? (
                            <span className="text-warning"> · faltan {i.missing}</span>
                          ) : (
                            <span className="text-success"> · suficiente</span>
                          )}
                        </span>
                      ) : null}
                    </span>
                    {i.needed ? (
                      <span className="shrink-0 text-muted">
                        ×{i.needed}
                        {i.unit ? ` ${i.unit}` : ''}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {missingRows.length > 0 ? (
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={addMissingToShoppingList}
                >
                  <ShoppingCart size={16} aria-hidden="true" />
                  Añadir lo que falta a la compra ({missingRows.length})
                </Button>
              ) : null}
            </>
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

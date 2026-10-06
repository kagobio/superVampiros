import { useMemo, useState } from 'react';
import { Check, Copy, Moon, ShoppingCart, Sun, Trash2, UtensilsCrossed, X } from 'lucide-react';
import type { MealPlan, MealSlot } from '@/domain/meal-plan/meal-plan.types';
import {
  MEAL_SLOTS,
  WEEK_DAYS,
  aggregatePlanIngredients,
  entriesToMap,
  mapToEntries,
  slotKey,
} from '@/domain/meal-plan/meal-plan.rules';
import { mealPlanService } from '@/services/meal-plan/meal-plan.service';
import { recipeService } from '@/services/recipe/recipe.service';
import { shoppingListService } from '@/services/shopping/shopping-list.service';
import type { MenuSlotContext } from '@/services/meal-plan/edit-menu.service';
import { toast } from '@/stores/toast.store';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useUnits } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useRecipes } from '@/features/recipes/hooks/useRecipes';
import { MealPlanAiChat } from './MealPlanAiChat';
import type { AppliedChange } from '../apply-menu-changes';

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

  // El padre remonta este componente (vía `key`) en cada apertura.
  const [name, setName] = useState(plan?.name ?? '');
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(entriesToMap(plan?.entries ?? [])),
  );

  const isEdit = plan !== null;

  const setSlot = (day: number, slot: MealSlot, recipeId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (recipeId) next[slotKey(day, slot)] = recipeId;
      else delete next[slotKey(day, slot)];
      return next;
    });
  };

  // Plato manual: crea una receta mínima (solo nombre, sin ingredientes) y la
  // asigna al hueco. Así el modelo sigue basándose en recetas y el plato queda
  // reutilizable; sus ingredientes se pueden añadir luego desde Recetas.
  const createDish = async (day: number, slot: MealSlot, rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    const recipe = await recipeService.create({ name });
    setSlot(day, slot, recipe.id);
  };

  // Contexto del menú actual para la IA (huecos ocupados, con nombre de receta).
  const getAiContext = (): MenuSlotContext[] => {
    const ctx: MenuSlotContext[] = [];
    for (const [key, recipeId] of Object.entries(assignments)) {
      const [dayStr, slot] = key.split(':');
      const recipe = recipesById.get(recipeId);
      if (!recipe) continue;
      ctx.push({
        dia: Number(dayStr),
        momento: slot === 'dinner' ? 'cena' : 'comida',
        nombre: recipe.name,
      });
    }
    return ctx;
  };

  // Aplica a la tabla los cambios resueltos por el chat de IA.
  const applyAiChanges = (changes: AppliedChange[]) => {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const c of changes) {
        const key = slotKey(c.day, c.slot);
        if (c.recipeId) next[key] = c.recipeId;
        else delete next[key];
      }
      return next;
    });
  };

  // Ingredientes derivados en vivo, con stock actual y lo que falta comprar.
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

  const stockItems = products.filter((p) => p.quantity > 0).map((p) => p.name);

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

        <MealPlanAiChat
          items={stockItems}
          recipes={recipes}
          products={products}
          getContext={getAiContext}
          onApply={applyAiChanges}
        />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-text">Menú de la semana</p>
            <span className="text-xs text-muted">Elige receta o escribe un plato</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
            <div className="grid grid-cols-[2.75rem_1fr_1fr] gap-1.5 border-b border-border bg-surface-2/60 px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
              <span />
              <span className="flex items-center justify-center gap-1">
                <Sun size={12} aria-hidden="true" /> Comida
              </span>
              <span className="flex items-center justify-center gap-1">
                <Moon size={12} aria-hidden="true" /> Cena
              </span>
            </div>
            <div className="divide-y divide-border">
              {WEEK_DAYS.map((dayLabel, day) => (
                <DayRow
                  key={dayLabel}
                  dayLabel={dayLabel}
                  day={day}
                  assignments={assignments}
                  recipes={recipes}
                  onChange={setSlot}
                  onCreateDish={createDish}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Ingredientes necesarios */}
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
      </div>
    </Sheet>
  );
}

interface DayRowProps {
  dayLabel: string;
  day: number;
  assignments: Record<string, string>;
  recipes: { id: string; name: string }[];
  onChange: (day: number, slot: MealSlot, recipeId: string) => void;
  onCreateDish: (day: number, slot: MealSlot, name: string) => void | Promise<void>;
}

function DayRow({ dayLabel, day, assignments, recipes, onChange, onCreateDish }: DayRowProps) {
  return (
    <div className="grid grid-cols-[2.75rem_1fr_1fr] items-center gap-1.5 px-2.5 py-2">
      <span className="text-xs font-semibold capitalize text-muted" title={dayLabel}>
        {dayLabel.slice(0, 3)}
      </span>
      {MEAL_SLOTS.map(({ slot, label }) => (
        <SlotPicker
          key={slot}
          day={day}
          slot={slot}
          label={label}
          dayLabel={dayLabel}
          value={assignments[slotKey(day, slot)] ?? ''}
          recipes={recipes}
          onChange={onChange}
          onCreateDish={onCreateDish}
        />
      ))}
    </div>
  );
}

/** Opción centinela del select para «escribir un plato nuevo». */
const NEW_DISH = '__new_dish__';

interface SlotPickerProps {
  day: number;
  slot: MealSlot;
  label: string;
  dayLabel: string;
  value: string;
  recipes: { id: string; name: string }[];
  onChange: (day: number, slot: MealSlot, recipeId: string) => void;
  onCreateDish: (day: number, slot: MealSlot, name: string) => void | Promise<void>;
}

/**
 * Hueco del menú: elige una receta existente o escribe un plato nuevo a mano.
 * Al elegir «Nuevo plato…» se cambia a un campo de texto; al confirmar, el
 * padre crea la receta mínima y la asigna.
 */
function SlotPicker({
  day,
  slot,
  label,
  dayLabel,
  value,
  recipes,
  onChange,
  onCreateDish,
}: SlotPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const filled = Boolean(value);
  // Si el valor aún no está en la lista (receta recién creada), lo mostramos
  // igualmente para que el select no quede en blanco mientras se refresca.
  const known = !value || recipes.some((r) => r.id === value);

  const cancel = () => {
    setAdding(false);
    setDraft('');
  };

  const confirm = async () => {
    const name = draft.trim();
    if (!name) {
      cancel();
      return;
    }
    await onCreateDish(day, slot, name);
    cancel();
  };

  if (adding) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void confirm();
            } else if (e.key === 'Escape') {
              cancel();
            }
          }}
          placeholder={`${label}…`}
          aria-label={`Nuevo plato para ${label.toLowerCase()} del ${dayLabel}`}
          className="h-11 min-w-0 flex-1 rounded-xl border border-primary/50 bg-surface px-2.5 text-sm text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        />
        <IconButton
          icon={Check}
          label="Guardar plato"
          size="sm"
          variant="solid"
          onClick={() => void confirm()}
        />
        <IconButton icon={X} label="Cancelar" size="sm" variant="ghost" onClick={cancel} />
      </div>
    );
  }

  return (
    <Select
      aria-label={`${label} del ${dayLabel}`}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === NEW_DISH) setAdding(true);
        else onChange(day, slot, v);
      }}
      className={filled ? 'border-primary/40 font-medium text-text' : 'text-muted'}
    >
      <option value="">—</option>
      {!known ? <option value={value}>Plato nuevo…</option> : null}
      {recipes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
      <option value={NEW_DISH}>➕ Nuevo plato…</option>
    </Select>
  );
}

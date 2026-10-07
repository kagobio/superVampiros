import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Moon,
  Plus,
  ShoppingCart,
  Star,
  Sun,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MealPlan, MealSlot } from '@/domain/meal-plan/meal-plan.types';
import {
  MEAL_SLOTS,
  WEEK_DAYS,
  aggregatePlanIngredients,
  entriesToMap,
  fillSlotsWithFavorites,
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
  // Nombre por defecto al crear, para que el botón de guardar esté siempre
  // disponible (antes quedaba deshabilitado si el nombre estaba vacío y no se
  // entendía cómo guardar la semana).
  const [name, setName] = useState(plan?.name ?? 'Mi semana');
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(entriesToMap(plan?.entries ?? [])),
  );
  // Hueco con el selector abierto (solo uno a la vez), por `slotKey`.
  const [openSlot, setOpenSlot] = useState<string | null>(null);

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

  const favoriteRecipes = useMemo(() => recipes.filter((r) => r.favorite), [recipes]);

  // Rellena de un toque los huecos vacíos de la semana con las comidas
  // habituales (favoritas), sin tocar lo ya asignado.
  const fillWithFavorites = () => {
    if (favoriteRecipes.length === 0) {
      toast('Marca alguna receta como comida habitual primero', 'default');
      return;
    }
    setAssignments((prev) => {
      const filled = fillSlotsWithFavorites(
        new Map(Object.entries(prev)),
        favoriteRecipes.map((r) => r.id),
      );
      return Object.fromEntries(filled);
    });
    toast('Huecos vacíos rellenados con tus comidas habituales', 'success');
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
    const finalName = name.trim() || 'Mi semana';
    const entries = mapToEntries(new Map(Object.entries(assignments)));
    if (isEdit) await mealPlanService.update(plan.id, { name: finalName, entries });
    else await mealPlanService.create({ name: finalName, entries });
    toast(isEdit ? 'Menú guardado' : 'Menú creado', 'success');
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
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="shrink-0 text-danger"
              aria-label="Eliminar menú"
            >
              <Trash2 size={18} aria-hidden="true" />
            </Button>
          ) : null}
          <Button onClick={handleSave} className="flex-1 justify-center">
            <Check size={18} aria-hidden="true" />
            Guardar menú
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
          {favoriteRecipes.length > 0 ? (
            <Button variant="secondary" className="mb-2.5 w-full" onClick={fillWithFavorites}>
              <Star size={16} aria-hidden="true" />
              Rellenar huecos con comidas habituales
            </Button>
          ) : null}
          <div className="space-y-2">
            {WEEK_DAYS.map((dayLabel, day) => (
              <div
                key={dayLabel}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
              >
                <p className="border-b border-border bg-surface-2/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {dayLabel}
                </p>
                <div className="divide-y divide-border">
                  {MEAL_SLOTS.map(({ slot, label }) => {
                    const key = slotKey(day, slot);
                    return (
                      <SlotPicker
                        key={slot}
                        day={day}
                        slot={slot}
                        label={label}
                        dayLabel={dayLabel}
                        value={assignments[key] ?? ''}
                        recipes={recipes}
                        open={openSlot === key}
                        onOpenChange={(o) => setOpenSlot(o ? key : null)}
                        onChange={setSlot}
                        onCreateDish={createDish}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
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

interface SlotRecipe {
  id: string;
  name: string;
  favorite?: boolean;
}

interface SlotPickerProps {
  day: number;
  slot: MealSlot;
  label: string;
  dayLabel: string;
  value: string;
  recipes: SlotRecipe[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (day: number, slot: MealSlot, recipeId: string) => void;
  onCreateDish: (day: number, slot: MealSlot, name: string) => void | Promise<void>;
}

/**
 * Hueco del menú (comida o cena de un día). Botón de ancho completo que muestra
 * el plato con el texto completo (se ajusta en varias líneas, no se corta) y, al
 * tocarlo, despliega la lista de recetas —favoritas arriba— o la opción de
 * escribir un plato nuevo a mano. Solo un hueco está abierto a la vez.
 */
function SlotPicker({
  day,
  slot,
  label,
  dayLabel,
  value,
  recipes,
  open,
  onOpenChange,
  onChange,
  onCreateDish,
}: SlotPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const filled = Boolean(value);
  const favorites = recipes.filter((r) => r.favorite);
  const others = recipes.filter((r) => !r.favorite);
  const selected = recipes.find((r) => r.id === value);
  const SlotIcon = slot === 'dinner' ? Moon : Sun;

  const close = () => {
    onOpenChange(false);
    setAdding(false);
    setDraft('');
  };

  const choose = (recipeId: string) => {
    onChange(day, slot, recipeId);
    close();
  };

  const confirm = async () => {
    const name = draft.trim();
    if (!name) {
      setAdding(false);
      setDraft('');
      return;
    }
    await onCreateDish(day, slot, name);
    close();
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={`${label} del ${dayLabel}`}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-2/40"
      >
        <span
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
            filled ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-muted',
          )}
        >
          <SlotIcon size={14} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
            {label}
          </span>
          <span
            className={cn(
              'block text-sm',
              filled ? 'font-medium text-text' : 'text-muted',
            )}
          >
            {selected ? selected.name : filled ? 'Plato nuevo…' : 'Elegir plato'}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn('mt-1 shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="border-t border-border bg-surface-2/30 px-2 pb-2 pt-1.5">
          {adding ? (
            <div className="flex items-center gap-1 p-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void confirm();
                  } else if (e.key === 'Escape') {
                    setAdding(false);
                    setDraft('');
                  }
                }}
                placeholder="Nombre del plato…"
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
              <IconButton
                icon={X}
                label="Cancelar"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraft('');
                }}
              />
            </div>
          ) : (
            <div className="space-y-0.5">
              {favorites.length > 0 ? (
                <>
                  <p className="px-2 pb-0.5 pt-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                    ⭐ Comidas habituales
                  </p>
                  {favorites.map((r) => (
                    <OptionButton
                      key={r.id}
                      name={r.name}
                      selected={r.id === value}
                      onClick={() => choose(r.id)}
                    />
                  ))}
                </>
              ) : null}
              {others.length > 0 ? (
                <>
                  <p className="px-2 pb-0.5 pt-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                    {favorites.length > 0 ? 'Otras recetas' : 'Recetas'}
                  </p>
                  {others.map((r) => (
                    <OptionButton
                      key={r.id}
                      name={r.name}
                      selected={r.id === value}
                      onClick={() => choose(r.id)}
                    />
                  ))}
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus size={15} aria-hidden="true" />
                Nuevo plato…
              </button>
              {filled ? (
                <button
                  type="button"
                  onClick={() => choose('')}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                >
                  <X size={15} aria-hidden="true" />
                  Quitar plato
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface OptionButtonProps {
  name: string;
  selected: boolean;
  onClick: () => void;
}

/** Opción de receta dentro del desplegable del hueco (el texto se ajusta, no se corta). */
function OptionButton({ name, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-2',
        selected ? 'bg-primary/10 font-medium text-text' : 'text-text',
      )}
    >
      <Check
        size={15}
        aria-hidden="true"
        className={cn('mt-0.5 shrink-0', selected ? 'text-primary' : 'text-transparent')}
      />
      <span className="min-w-0 flex-1">{name}</span>
    </button>
  );
}

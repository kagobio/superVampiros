import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronRight, Moon, Pencil, Sparkles, Sun } from 'lucide-react';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';
import type { Id } from '@/domain/shared/ids';
import { WEEK_DAYS, entriesToMap, slotKey } from '@/domain/meal-plan/meal-plan.rules';
import type { GeneratedMenu } from '@/services/meal-plan/suggest-menu.service';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/cn';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useRecipes } from '@/features/recipes/hooks/useRecipes';
import { useMealPlans } from './hooks/useMealPlans';
import { MealPlanEditorSheet } from './components/MealPlanEditorSheet';
import { MealPlanGeneratorSheet } from './components/MealPlanGeneratorSheet';
import { createMenuFromGenerated } from './build-from-generated';

export function MealPlansPage() {
  const plans = useMealPlans();
  const products = useProducts();
  const recipes = useRecipes();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [openKey, setOpenKey] = useState(0);
  const [genOpen, setGenOpen] = useState(false);

  const openEditor = (plan: MealPlan | null) => {
    setEditing(plan);
    setOpenKey((k) => k + 1);
    setSheetOpen(true);
  };
  const openCreate = () => openEditor(null);

  // Abre directamente un menú si se llega aquí con `openPlanId` en el estado de
  // navegación (p. ej. desde la tarjeta «Hoy» del inicio). Solo una vez, cuando
  // los menús ya han cargado (useLiveQuery es asíncrono), por eso va en efecto.
  const location = useLocation();
  const openedFromState = useRef(false);
  useEffect(() => {
    if (openedFromState.current) return;
    const openPlanId = (location.state as { openPlanId?: string } | null)?.openPlanId;
    if (!openPlanId) return;
    const plan = plans.find((p) => p.id === openPlanId);
    if (!plan) return;
    openedFromState.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abrir la hoja al llegar con intención de navegación, una vez cargados los menús
    openEditor(plan);
  }, [location.state, plans]);

  const itemsInStock = products.filter((p) => p.quantity > 0).map((p) => p.name);
  const favoriteNames = recipes.filter((r) => r.favorite).map((r) => r.name);

  const recipeNameById = useMemo(
    () => new Map(recipes.map((r) => [r.id, r.name])),
    [recipes],
  );
  // Día de hoy para resaltarlo en la tabla. App: 0 = Lunes … 6 = Domingo.
  const todayIndex = (new Date().getDay() + 6) % 7;

  // La IA devuelve el menú; aquí lo materializamos (recetas + menú) y lo abrimos
  // en el editor para que el usuario lo revise y ajuste.
  const handleGenerated = async (menu: GeneratedMenu) => {
    const plan = await createMenuFromGenerated(menu, products, recipes);
    setGenOpen(false);
    toast('Menú generado. Revísalo y ajústalo si quieres.', 'success');
    openEditor(plan);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/recetas"
          aria-label="Volver"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.75rem]">Menús semanales</h1>
          <p className="text-sm text-muted">Planifica la semana y mira qué te falta comprar.</p>
        </div>
        {plans.length > 0 ? (
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted">
            {plans.length}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setGenOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-left shadow-soft transition-[transform,background-color,border-color] hover:border-primary/40 hover:bg-primary/10 active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg">
          <Sparkles size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-text">Generar menú con IA</span>
          <span className="block text-xs text-muted">
            Según lo que tienes en casa y tus preferencias.
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
        />
      </button>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay menús"
          description="Genera un menú con IA según tus preferencias, o créalo a mano asignando recetas a cada día. El menú te muestra los ingredientes que necesitas."
          action={
            <Button variant="secondary" onClick={openCreate}>
              <Pencil size={16} aria-hidden="true" />
              Crear a mano
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {plans.map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => openEditor(plan)}
                className="group block w-full rounded-2xl border border-border bg-surface p-3 text-left shadow-soft transition-[transform,border-color] hover:border-primary/30 active:scale-[0.99] motion-reduce:active:scale-100"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text">{plan.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {plan.entries.length} comida{plan.entries.length === 1 ? '' : 's'} planificada
                      {plan.entries.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-muted/60 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <WeekTable plan={plan} recipeNameById={recipeNameById} todayIndex={todayIndex} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={openCreate} label="Crear menú a mano" />

      <MealPlanGeneratorSheet
        key={`gen-${genOpen}`}
        open={genOpen}
        onClose={() => setGenOpen(false)}
        items={itemsInStock}
        favorites={favoriteNames}
        onGenerated={handleGenerated}
      />

      <MealPlanEditorSheet
        key={openKey}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        plan={editing}
      />
    </div>
  );
}

interface WeekTableProps {
  plan: MealPlan;
  recipeNameById: Map<Id, string>;
  todayIndex: number;
}

/**
 * Tabla compacta de un menú: una fila por día con la comida y la cena, para
 * ver la semana entera de un vistazo sin abrir el editor. Resalta el día de
 * hoy. Solo texto (va dentro del botón de la tarjeta, que abre el editor).
 */
function WeekTable({ plan, recipeNameById, todayIndex }: WeekTableProps) {
  const byKey = entriesToMap(plan.entries);
  const nameAt = (day: number, slot: 'lunch' | 'dinner') => {
    const id = byKey.get(slotKey(day, slot));
    return id ? (recipeNameById.get(id) ?? null) : null;
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[2.4rem_1fr_1fr] bg-surface-2/60 text-[0.62rem] font-semibold uppercase tracking-wide text-muted">
        <div className="px-2 py-1.5" aria-hidden="true" />
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Sun size={11} aria-hidden="true" />
          Comida
        </div>
        <div className="flex items-center gap-1 border-l border-border px-2 py-1.5">
          <Moon size={11} aria-hidden="true" />
          Cena
        </div>
      </div>
      <div className="divide-y divide-border">
        {WEEK_DAYS.map((dayLabel, day) => {
          const isToday = day === todayIndex;
          const lunch = nameAt(day, 'lunch');
          const dinner = nameAt(day, 'dinner');
          return (
            <div
              key={dayLabel}
              className={cn('grid grid-cols-[2.4rem_1fr_1fr] text-xs', isToday && 'bg-primary/[0.07]')}
            >
              <div
                className={cn(
                  'flex items-center px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-wide',
                  isToday ? 'text-primary' : 'text-muted',
                )}
              >
                {dayLabel.slice(0, 3)}
              </div>
              <div className="px-2 py-1.5 text-text">
                {lunch ?? <span className="text-muted/50">—</span>}
              </div>
              <div className="border-l border-border px-2 py-1.5 text-text">
                {dinner ?? <span className="text-muted/50">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

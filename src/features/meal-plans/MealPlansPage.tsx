import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronRight, Pencil, Sparkles } from 'lucide-react';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';
import type { GeneratedMenu } from '@/services/meal-plan/suggest-menu.service';
import { toast } from '@/stores/toast.store';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useMealPlans } from './hooks/useMealPlans';
import { MealPlanEditorSheet } from './components/MealPlanEditorSheet';
import { MealPlanGeneratorSheet } from './components/MealPlanGeneratorSheet';
import { createMenuFromGenerated } from './build-from-generated';

export function MealPlansPage() {
  const plans = useMealPlans();
  const products = useProducts();
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

  const itemsInStock = products.filter((p) => p.quantity > 0).map((p) => p.name);

  // La IA devuelve el menú; aquí lo materializamos (recetas + menú) y lo abrimos
  // en el editor para que el usuario lo revise y ajuste.
  const handleGenerated = async (menu: GeneratedMenu) => {
    const plan = await createMenuFromGenerated(menu, products);
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
        className="group flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-left shadow-soft transition-colors hover:border-primary/40 hover:bg-primary/10"
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
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => openEditor(plan)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left shadow-soft transition-colors hover:border-primary/30 hover:bg-surface-2"
              >
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

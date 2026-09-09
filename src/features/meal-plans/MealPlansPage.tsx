import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import type { MealPlan } from '@/domain/meal-plan/meal-plan.types';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMealPlans } from './hooks/useMealPlans';
import { MealPlanEditorSheet } from './components/MealPlanEditorSheet';

export function MealPlansPage() {
  const plans = useMealPlans();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [openKey, setOpenKey] = useState(0);

  const openEditor = (plan: MealPlan | null) => {
    setEditing(plan);
    setOpenKey((k) => k + 1);
    setSheetOpen(true);
  };
  const openCreate = () => openEditor(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/recetas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="flex-1 text-2xl">Menús semanales</h1>
        <span className="text-sm text-muted">{plans.length}</span>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay menús"
          description="Planifica la comida y la cena de cada día con tus recetas. El menú te muestra la lista de ingredientes que necesitas."
          action={<Button onClick={openCreate}>Crear menú</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <button
                type="button"
                onClick={() => openEditor(plan)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate font-medium text-text">{plan.name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {plan.entries.length} comida{plan.entries.length === 1 ? '' : 's'} planificada
                  {plan.entries.length === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={openCreate} label="Crear menú" />

      <MealPlanEditorSheet
        key={openKey}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        plan={editing}
      />
    </div>
  );
}

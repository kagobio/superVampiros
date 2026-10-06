import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Sparkles } from 'lucide-react';
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

      <Button className="w-full" onClick={() => setGenOpen(true)}>
        <Sparkles size={18} aria-hidden="true" />
        Generar menú con IA
      </Button>

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

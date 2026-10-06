import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { generateMenu, type GeneratedMenu } from '@/services/meal-plan/suggest-menu.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';

interface MealPlanGeneratorSheetProps {
  open: boolean;
  onClose: () => void;
  /** Nombres de productos en stock (contexto para la IA). */
  items: string[];
  /** Se llama con el menú generado; el padre crea recetas + menú y lo abre. */
  onGenerated: (menu: GeneratedMenu) => Promise<void> | void;
}

// Preferencias frecuentes que el usuario puede añadir con un toque.
const QUICK_PREFS = [
  'Rápido entre semana',
  'Sano y ligero',
  'Vegetariano',
  'Para 2 personas',
  'Sin pescado',
  'Presupuesto bajo',
  'Aprovecha lo que caduca',
];

export function MealPlanGeneratorSheet({
  open,
  onClose,
  items,
  onGenerated,
}: MealPlanGeneratorSheetProps) {
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPref = (pref: string) => {
    setPreferences((prev) => {
      const parts = prev
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.some((p) => p.toLowerCase() === pref.toLowerCase())) return prev;
      return parts.length ? `${parts.join(', ')}, ${pref}` : pref;
    });
  };

  const generate = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const menu = await generateMenu(items, preferences);
      if (menu.comidas.length === 0) {
        setError('La IA no propuso ningún plato. Prueba a describir tus preferencias de otra forma.');
        return;
      }
      await onGenerated(menu);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el menú con IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Generar menú con IA"
      footer={
        <Button className="w-full" onClick={generate} disabled={loading}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {loading ? 'Generando menú…' : 'Generar menú'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-muted">
            Dime cómo quieres comer esta semana y te preparo el menú completo (comida y cena de
            cada día) aprovechando lo que tienes en casa.
          </p>
        </div>

        <div>
          <label htmlFor="menu-prefs" className="mb-1.5 block text-sm font-medium text-text">
            Tus preferencias
          </label>
          <TextArea
            id="menu-prefs"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="P. ej.: sano y variado, para 2, cenas ligeras, sin cerdo, poco tiempo entre semana…"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_PREFS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addPref(p)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-text transition-colors hover:bg-surface-2"
            >
              {p}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">
            No tienes productos con stock: la IA propondrá un menú variado y luego podrás ver qué
            comprar.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
      </div>
    </Sheet>
  );
}

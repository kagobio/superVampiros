import { Check, Loader2, ShoppingCart } from 'lucide-react';
import type { SuggestedRecipe } from '@/services/recipe/suggest.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

interface SuggestionsSheetProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  suggestions: SuggestedRecipe[];
  onSave: (recipe: SuggestedRecipe) => void;
}

export function SuggestionsSheet({
  open,
  onClose,
  loading,
  error,
  suggestions,
  onSave,
}: SuggestionsSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Sugerencias con tu inventario">
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <p className="text-sm">Pensando recetas con lo que tienes…</p>
        </div>
      ) : error ? (
        <EmptyState
          icon={ShoppingCart}
          title="No se pudieron sugerir recetas"
          description={error}
        />
      ) : suggestions.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin sugerencias por ahora" />
      ) : (
        <ul className="space-y-4">
          {suggestions.map((s, i) => (
            <li
              key={`${s.nombre}-${i}`}
              className="rounded-2xl border border-border bg-surface p-3"
            >
              <h3 className="text-base">{s.nombre}</h3>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.ingredientes.map((ing, j) => (
                  <span
                    key={j}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                      ing.tengo ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted',
                    )}
                  >
                    {ing.tengo ? <Check size={12} aria-hidden="true" /> : null}
                    {ing.nombre}
                  </span>
                ))}
              </div>

              {s.pasos.length > 0 ? (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
                  {s.pasos.map((p, k) => (
                    <li key={k}>{p}</li>
                  ))}
                </ol>
              ) : null}

              <Button size="sm" variant="secondary" className="mt-3" onClick={() => onSave(s)}>
                Guardar receta
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

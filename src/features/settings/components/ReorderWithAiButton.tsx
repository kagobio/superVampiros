import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { recategorizeAll } from '@/services/categorize/categorize.service';
import { toast } from '@/stores/toast.store';
import { useCategories } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';

/**
 * Acción de mantenimiento: reclasifica TODOS los productos con IA de una pasada.
 * Sustituye las categorías actuales, así que pide confirmación. Muestra progreso
 * mientras trabaja (puede tardar con muchos productos).
 */
export function ReorderWithAiButton() {
  const products = useProducts();
  const categories = useCategories();
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const running = progress !== null;
  const disabled = products.length === 0 || categories.length === 0;

  const run = async () => {
    setConfirming(false);
    setProgress({ done: 0, total: products.length });
    try {
      const n = await recategorizeAll(products, categories, (done, total) =>
        setProgress({ done, total }),
      );
      toast(
        n > 0
          ? `Reordenados ${n} ${n === 1 ? 'producto' : 'productos'} con IA`
          : 'No hubo cambios (¿sin conexión?)',
        n > 0 ? 'success' : 'default',
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {running ? (
            <Loader2 size={20} aria-hidden="true" className="animate-spin" />
          ) : (
            <Sparkles size={20} aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-text">Reordenar todo con IA</span>
          <span className="block text-xs text-muted">
            {running
              ? `Reordenando… ${progress.done}/${progress.total}`
              : 'Reclasifica todos los productos (sustituye sus categorías actuales).'}
          </span>
        </span>
      </div>

      {!running ? (
        confirming ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={run}
              className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Reordenar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-text"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={disabled}
            className="mt-3 w-full rounded-xl border border-primary/40 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            Reordenar inventario
          </button>
        )
      ) : null}
    </div>
  );
}

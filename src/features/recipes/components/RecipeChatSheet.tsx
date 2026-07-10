import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ChefHat, Loader2, Send, Sparkles } from 'lucide-react';
import {
  chatRecipes,
  type ChatMessage,
  type SuggestedRecipe,
} from '@/services/recipe/suggest.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface RecipeChatSheetProps {
  open: boolean;
  onClose: () => void;
  /** Nombres de los productos en stock (contexto para la IA). */
  items: string[];
  onSave: (recipe: SuggestedRecipe) => void;
}

type Turn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; mensaje: string; recetas: SuggestedRecipe[] };

// Ideas rápidas que el usuario puede pulsar para empezar/afinar.
const QUICK_PROMPTS = [
  'Algo rápido',
  'Más sano',
  'Vegetariano',
  'Una cena para 2',
  'Usa lo que caduca pronto',
];

/** Convierte los turnos mostrados en el historial que espera la función. */
function toMessages(turns: Turn[]): ChatMessage[] {
  return turns.map((t) =>
    t.role === 'user'
      ? { role: 'user' as const, content: t.text }
      : {
          role: 'assistant' as const,
          content: JSON.stringify({ mensaje: t.mensaje, recetas: t.recetas }),
        },
  );
}

function RecipeCard({
  recipe,
  onSave,
}: {
  recipe: SuggestedRecipe;
  onSave: (r: SuggestedRecipe) => void;
}) {
  return (
    <div className="mt-2 rounded-2xl border border-border bg-bg p-3">
      <h3 className="font-display text-base text-text">{recipe.nombre}</h3>

      {recipe.ingredientes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.ingredientes.map((ing, j) => (
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
      ) : null}

      {recipe.pasos.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
          {recipe.pasos.map((p, k) => (
            <li key={k}>{p}</li>
          ))}
        </ol>
      ) : null}

      <Button size="sm" variant="secondary" className="mt-3" onClick={() => onSave(recipe)}>
        <ChefHat size={14} aria-hidden="true" />
        Guardar receta
      </Button>
    </div>
  );
}

export function RecipeChatSheet({ open, onClose, items, onSave }: RecipeChatSheetProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, loading]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    const nextTurns: Turn[] = [...turns, { role: 'user', text }];
    setTurns(nextTurns);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const reply = await chatRecipes(items, toMessages(nextTurns));
      const mensaje =
        reply.mensaje || (reply.recetas.length ? 'Aquí tienes:' : 'No se me ocurre nada, dime más.');
      setTurns((prev) => [...prev, { role: 'assistant', mensaje, recetas: reply.recetas }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo hablar con el Chef IA.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Chef IA"
      footer={
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pide una receta o da instrucciones…"
            aria-label="Mensaje para el Chef IA"
            className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          />
          <button
            type="submit"
            disabled={loading || input.trim() === ''}
            aria-label="Enviar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </form>
      }
    >
      <div className="space-y-3">
        {turns.length === 0 ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm text-muted">
              Cocino con lo que tienes en el inventario. Pídeme una receta o dime cómo la quieres.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-text transition-colors hover:bg-surface-2"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((turn, i) =>
          turn.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-fg">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-start">
              {turn.mensaje ? (
                <p className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-sm text-text">
                  {turn.mensaje}
                </p>
              ) : null}
              {turn.recetas.map((r, j) => (
                <RecipeCard key={j} recipe={r} onSave={onSave} />
              ))}
            </div>
          ),
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Pensando…
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </Sheet>
  );
}

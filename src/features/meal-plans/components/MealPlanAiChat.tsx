import { useRef, useState, type FormEvent } from 'react';
import { Check, Loader2, Send, Sparkles } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { WEEK_DAYS } from '@/domain/meal-plan/meal-plan.rules';
import {
  editMenu,
  type ChatMessage,
  type MenuEditReply,
  type MenuSlotContext,
} from '@/services/meal-plan/edit-menu.service';
import { applyMenuChanges, type AppliedChange } from '../apply-menu-changes';

interface MealPlanAiChatProps {
  items: string[];
  recipes: Recipe[];
  products: Product[];
  /** Devuelve el estado actual del menú en el momento de enviar. */
  getContext: () => MenuSlotContext[];
  /** Aplica los cambios resueltos a la tabla del editor. */
  onApply: (changes: AppliedChange[]) => void;
}

type Turn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; reply: MenuEditReply; applied: AppliedChange[] };

const QUICK = ['Hazme el menú de la semana', 'Algo vegetariano', 'Cenas más ligeras', 'Usa lo que caduca'];

function toMessages(turns: Turn[]): ChatMessage[] {
  return turns.map((t) =>
    t.role === 'user'
      ? { role: 'user' as const, content: t.text }
      : { role: 'assistant' as const, content: JSON.stringify(t.reply) },
  );
}

const momentoLabel = (m: 'comida' | 'cena') => (m === 'cena' ? 'Cena' : 'Comida');

export function MealPlanAiChat({
  items,
  recipes,
  products,
  getContext,
  onApply,
}: MealPlanAiChatProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    const nextTurns: Turn[] = [...turns, { role: 'user', text }];
    setTurns(nextTurns);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const reply = await editMenu(items, getContext(), toMessages(nextTurns));
      const applied = await applyMenuChanges(reply.cambios, recipes, products);
      if (applied.length > 0) onApply(applied);
      setTurns((prev) => [...prev, { role: 'assistant', reply, applied }]);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo editar el menú con IA.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text">
        <Sparkles size={15} className="text-primary" aria-hidden="true" />
        Editar con IA
      </p>
      <p className="mt-0.5 text-xs text-muted">
        Pídele que añada, cambie o quite platos (p. ej. “cambia la cena del martes por algo
        ligero”).
      </p>

      {turns.length > 0 ? (
        <div className="mt-3 space-y-2">
          {turns.map((turn, i) =>
            turn.role === 'user' ? (
              <p
                key={i}
                className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-1.5 text-sm text-primary-fg"
              >
                {turn.text}
              </p>
            ) : (
              <div key={i} className="space-y-1.5">
                {turn.reply.mensaje ? (
                  <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3 py-1.5 text-sm text-text">
                    {turn.reply.mensaje}
                  </p>
                ) : null}
                {turn.applied.length > 0 ? (
                  <ul className="space-y-1">
                    {turn.reply.cambios.map((c, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-1.5 text-xs text-muted"
                      >
                        <Check size={12} className="shrink-0 text-success" aria-hidden="true" />
                        {WEEK_DAYS[c.dia]} · {momentoLabel(c.momento)}:{' '}
                        {c.accion === 'clear' ? (
                          <span className="italic">vaciado</span>
                        ) : (
                          <span className="text-text">{c.receta?.nombre}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text transition-colors hover:bg-surface-2"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Pensando…
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs text-danger">{error}</p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pídele un cambio…"
          aria-label="Mensaje para editar el menú con IA"
          className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ''}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { useToastStore, type ToastTone } from '@/stores/toast.store';
import { cn } from '@/lib/cn';

const toneClass: Record<ToastTone, string> = {
  default: 'bg-surface-2 text-text',
  success: 'bg-success text-white',
  warning: 'bg-warning text-black',
  danger: 'bg-danger text-white',
};

// Cuántos avisos se ven a la vez; los más antiguos quedan ocultos tras la pila.
const MAX_VISIBLE = 3;
const SWIPE_DISTANCE = 60; // px para descartar al deslizar
const SWIPE_VELOCITY = 400; // px/s de impulso al soltar

/**
 * Contenedor de notificaciones transitorias (estilo Sonner): pila con
 * profundidad, entrada/salida con muelle y deslizar‑para‑descartar.
 * El aviso más reciente queda al frente; los anteriores se escalan por detrás.
 * Respeta `prefers-reduced-motion`.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const reduce = useReducedMotion();

  // Solo los últimos N, con el más nuevo al final (al frente de la pila).
  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {visible.map((t, i) => {
          // Profundidad en la pila: 0 = al frente (el más reciente).
          const depth = visible.length - 1 - i;
          const handleDragEnd = (_e: PointerEvent, info: PanInfo) => {
            if (info.offset.y > SWIPE_DISTANCE || info.velocity.y > SWIPE_VELOCITY) {
              dismiss(t.id);
            }
          };
          return (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
              animate={
                reduce
                  ? { opacity: 1 }
                  : {
                      opacity: depth > 1 ? 0.7 : 1,
                      y: 0,
                      scale: 1 - depth * 0.05,
                    }
              }
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 8 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }
              }
              drag={reduce ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              style={{ zIndex: visible.length - depth }}
              className={cn(
                'pointer-events-auto flex max-w-md touch-none items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg',
                toneClass[t.tone],
              )}
            >
              <span>{t.message}</span>
              {t.action ? (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="-my-1 shrink-0 rounded-lg px-2 py-1 font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {t.action.label}
                </button>
              ) : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, type ToastTone } from '@/stores/toast.store';
import { cn } from '@/lib/cn';

const toneClass: Record<ToastTone, string> = {
  default: 'bg-surface-2 text-text',
  success: 'bg-success text-white',
  warning: 'bg-warning text-black',
  danger: 'bg-danger text-white',
};

/** Contenedor de notificaciones transitorias, anclado sobre la navegación. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg',
              toneClass[t.tone],
            )}
          >
            <span>{t.message}</span>
            {t.action ? (
              <button
                type="button"
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
        ))}
      </AnimatePresence>
    </div>
  );
}

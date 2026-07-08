import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Contenido fijo al pie (p. ej. acciones de guardado). */
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Panel deslizante inferior (mobile-first) para formularios y detalles.
 * Accesible: role=dialog, foco atrapado, cierre con Escape y bloqueo de scroll.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();

  // Bloquea el scroll del fondo mientras el sheet está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Foco inicial dentro del panel al abrir.
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [open]);

  // Escape para cerrar + trampa de foco (Tab cíclico).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.6)]"
            initial={{ y: reduce ? 0 : '100%' }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : '100%' }}
            transition={{ type: 'tween', duration: reduce ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-lg">
                {title}
              </h2>
              <IconButton icon={X} label="Cerrar" onClick={onClose} size="sm" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
            {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

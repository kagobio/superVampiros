import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
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

// Umbrales para el gesto de arrastrar‑para‑cerrar (estilo hoja nativa).
const CLOSE_DISTANCE = 120; // px arrastrados hacia abajo
const CLOSE_VELOCITY = 500; // px/s de impulso al soltar

/**
 * Panel deslizante inferior (mobile-first) para formularios y detalles.
 * Accesible: role=dialog, foco atrapado, cierre con Escape y bloqueo de scroll.
 * Se puede arrastrar hacia abajo (desde la cabecera) para cerrar, con la curva
 * de muelle habitual de las hojas nativas. Respeta `prefers-reduced-motion`.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const dragControls = useDragControls();

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

  // Al soltar: si se arrastró lo suficiente o con impulso, cierra; si no,
  // Framer devuelve el panel a su sitio con muelle.
  const handleDragEnd = (_e: PointerEvent, info: PanInfo) => {
    if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) {
      onClose();
    }
  };

  // Se renderiza en un portal a <body> para salir del contexto de apilamiento
  // de <main> (que tiene z-10). Si no, el panel —aunque sea z-50— queda por
  // debajo de la barra de navegación inferior (z-20, hermana de <main>), que
  // tapaba el pie con el botón de guardar.
  return createPortal(
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
            transition={
              reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 40, mass: 0.8 }
            }
            drag={reduce ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {/* Zona de agarre: tirador + cabecera. Inicia el arrastre. */}
            <div
              onPointerDown={(e) => {
                if (!reduce) dragControls.start(e);
              }}
              className={reduce ? '' : 'cursor-grab touch-none select-none active:cursor-grabbing'}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 pb-3 pt-1">
                <h2 id={titleId} className="text-lg">
                  {title}
                </h2>
                {/* Evita que pulsar «Cerrar» inicie el arrastre. */}
                <span onPointerDown={(e) => e.stopPropagation()}>
                  <IconButton icon={X} label="Cerrar" onClick={onClose} size="sm" />
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
            {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

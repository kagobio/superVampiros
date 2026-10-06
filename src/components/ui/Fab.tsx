import { Plus, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface FabProps {
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
  /** Variante visual: primaria (rellena) o secundaria (superficie). */
  variant?: 'primary' | 'secondary';
  /** Clases extra para reposicionar (p. ej. apilar un segundo FAB). */
  className?: string;
}

/**
 * Botón de acción flotante. Se ancla por encima de la navegación inferior para
 * que la acción principal esté siempre a un toque.
 */
export function Fab({
  onClick,
  label,
  icon: Icon = Plus,
  variant = 'primary',
  className,
}: FabProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={
        reduce ? { duration: 0 } : { type: 'spring', stiffness: 600, damping: 24, mass: 0.5 }
      }
      className={cn(
        'fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl mb-[env(safe-area-inset-bottom)]',
        variant === 'primary'
          ? 'bg-primary text-primary-fg shadow-[0_8px_22px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:bg-primary-hover'
          : 'border border-border bg-surface text-text shadow-soft hover:bg-surface-2',
        className ?? 'bottom-20',
      )}
    >
      <Icon size={26} aria-hidden="true" />
    </motion.button>
  );
}

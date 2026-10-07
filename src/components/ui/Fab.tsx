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
      initial={reduce ? false : { scale: 0, rotate: -90 }}
      animate={reduce ? undefined : { scale: 1, rotate: 0 }}
      whileTap={reduce ? undefined : { scale: 0.86 }}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      transition={
        reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 22, mass: 0.6 }
      }
      className={cn(
        'fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl mb-[env(safe-area-inset-bottom)]',
        variant === 'primary'
          ? 'bg-gradient-primary text-primary-fg shadow-glow'
          : 'border border-border bg-surface text-text shadow-soft hover:bg-surface-2',
        className ?? 'bottom-20',
      )}
    >
      <Icon size={26} aria-hidden="true" />
    </motion.button>
  );
}

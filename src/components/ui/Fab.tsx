import { Plus, type LucideIcon } from 'lucide-react';
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform active:scale-95 mb-[env(safe-area-inset-bottom)]',
        variant === 'primary'
          ? 'bg-primary text-primary-fg shadow-[0_12px_28px_-10px_rgba(0,0,0,0.5)] hover:bg-primary-hover'
          : 'border border-border bg-surface text-text shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)] hover:bg-surface-2',
        className ?? 'bottom-20',
      )}
    >
      <Icon size={26} aria-hidden="true" />
    </button>
  );
}

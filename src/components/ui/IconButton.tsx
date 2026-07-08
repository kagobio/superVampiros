import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'solid' | 'ghost' | 'subtle';
type Size = 'sm' | 'md';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Etiqueta accesible obligatoria (botón de solo icono). */
  label: string;
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  solid: 'bg-primary text-primary-fg hover:bg-primary-hover',
  subtle: 'bg-surface-2 text-text hover:bg-border',
  ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-text',
};

const sizes: Record<Size, { box: string; icon: number }> = {
  sm: { box: 'h-9 w-9', icon: 18 },
  md: { box: 'h-11 w-11', icon: 20 },
};

/** Botón cuadrado de un solo icono, accesible por defecto. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...props },
  ref,
) {
  const s = sizes[size];
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        s.box,
        className,
      )}
      {...props}
    >
      <Icon size={s.icon} aria-hidden="true" />
    </button>
  );
});

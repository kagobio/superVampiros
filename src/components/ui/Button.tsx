import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,filter,opacity] ' +
  'select-none active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 ' +
  'motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-primary text-primary-fg shadow-glow hover:-translate-y-0.5 hover:brightness-[1.05] hover:shadow-lift',
  secondary:
    'bg-surface text-text border border-border shadow-soft hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-lift',
  ghost: 'bg-transparent text-text hover:bg-surface-2',
  danger:
    'bg-danger text-white shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--danger)_55%,transparent)] hover:-translate-y-0.5 hover:brightness-[1.05]',
};

// Objetivos táctiles cómodos: mínimo 44px de alto en `md`/`lg` (accesibilidad).
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

/** Botón base del sistema de diseño. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

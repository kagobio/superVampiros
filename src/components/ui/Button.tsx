import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-[-0.01em] transition ' +
  'select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ' +
  'motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-fg shadow-[0_1px_2px_rgb(60_24_32/0.18),0_8px_20px_-10px_rgb(60_24_32/0.5)] hover:bg-primary-hover',
  secondary: 'bg-surface-2 text-text border border-border hover:border-primary/40 hover:bg-surface',
  ghost: 'bg-transparent text-text hover:bg-surface-2',
  danger:
    'bg-danger text-primary-fg shadow-[0_1px_2px_rgb(60_24_32/0.18),0_8px_20px_-10px_rgb(120_20_32/0.5)] hover:opacity-90',
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

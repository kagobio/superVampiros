import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Select nativo (accesible y rápido en móvil) con chevron propio. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlClass, 'h-11 appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
});

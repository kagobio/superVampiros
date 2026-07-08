import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Etiqueta accesible del elemento (p. ej. el nombre del producto). */
  label: string;
  /** Sufijo opcional mostrado tras la cantidad (p. ej. abreviatura de unidad). */
  unit?: string;
  min?: number;
  size?: 'sm' | 'md';
}

/**
 * Control −/+ para ajustar la cantidad al instante, sin abrir nada.
 * Es la interacción más frecuente de la app (regla de oro < 2 s), por eso los
 * botones son grandes y accesibles y la cantidad se anuncia con `aria-live`.
 */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  label,
  unit,
  min = 0,
  size = 'md',
}: StepperProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 16 : 18;
  const atMin = value <= min;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-surface-2 p-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={atMin}
        aria-label={`Quitar uno de ${label}`}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-text transition-colors',
          'hover:bg-border disabled:pointer-events-none disabled:opacity-30',
          box,
        )}
      >
        <Minus size={iconSize} aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
        className="min-w-10 text-center text-sm font-semibold tabular-nums"
      >
        {value}
        {unit ? <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span> : null}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Añadir uno de ${label}`}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-text transition-colors hover:bg-border',
          box,
        )}
      >
        <Plus size={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
}

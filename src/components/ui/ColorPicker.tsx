import { Check } from 'lucide-react';
import { PALETTE } from '@/config/constants';
import { cn } from '@/lib/cn';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

/** Selector de color entre la paleta sugerida de la app. */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
      {PALETTE.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-transform',
              selected ? 'ring-2 ring-offset-2 ring-offset-surface' : 'hover:scale-110',
            )}
            style={{
              backgroundColor: color,
              boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
            }}
          >
            {selected ? <Check size={16} className="text-white" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

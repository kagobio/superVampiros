import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

/** Chip de filtro conmutable (toggle) accesible. */
export function FilterChip({ label, active, onClick, icon: Icon }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-transparent bg-primary text-primary-fg'
          : 'border-border text-muted hover:text-text',
      )}
    >
      {Icon ? <Icon size={15} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

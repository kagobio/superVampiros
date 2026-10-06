import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'danger' | 'warning' | 'success' | 'primary';

interface StatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
}

/** Chip del icono: tinte suave del tono para dar color sin saturar la tarjeta. */
const toneChip: Record<Tone, string> = {
  default: 'bg-surface-2 text-muted',
  danger: 'bg-danger/12 text-danger',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/12 text-success',
  primary: 'bg-primary/10 text-primary',
};

/** Tarjeta de métrica del dashboard. Si recibe `onClick`, actúa como botón. */
export function Stat({ label, value, icon: Icon, tone = 'default', onClick }: StatProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
          toneChip[tone],
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="mt-3 block text-[1.75rem] font-semibold leading-none tabular-nums tracking-[-0.02em] text-text">
        {value}
      </span>
      <span className="mt-1 block text-xs font-medium text-muted">{label}</span>
    </>
  );

  const base = 'block rounded-2xl border border-border bg-surface p-3.5 text-left shadow-soft';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          'transition-[transform,border-color,background-color]',
          'hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98]',
          'motion-reduce:transform-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
        )}
      >
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}

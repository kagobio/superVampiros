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

const toneText: Record<Tone, string> = {
  default: 'text-muted',
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  primary: 'text-primary',
};

/** Tarjeta de métrica del dashboard. Si recibe `onClick`, actúa como botón. */
export function Stat({ label, value, icon: Icon, tone = 'default', onClick }: StatProps) {
  const content = (
    <>
      <span className="flex items-center justify-between">
        <Icon size={18} className={toneText[tone]} aria-hidden="true" />
        <span className="text-2xl font-semibold tabular-nums text-text">{value}</span>
      </span>
      <span className="mt-1 block text-xs text-muted">{label}</span>
    </>
  );

  const base = 'block rounded-2xl border border-border bg-surface p-3 text-left';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, 'transition-colors hover:bg-surface-2')}
      >
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Estado vacío reutilizable (listas sin resultados, sin datos, etc.). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <Icon size={26} aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-[-0.01em] text-text">{title}</p>
        {description ? (
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

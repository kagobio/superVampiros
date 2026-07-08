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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon size={26} aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-text">{title}</p>
        {description ? <p className="mx-auto max-w-xs text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

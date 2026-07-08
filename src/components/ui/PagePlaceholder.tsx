import type { LucideIcon } from 'lucide-react';

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

/** Estado provisional para pantallas aún no implementadas (Fase 0). */
export function PagePlaceholder({ icon: Icon, title, description, phase }: PagePlaceholderProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-primary">
        <Icon size={30} aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h1 className="text-2xl">{title}</h1>
        <p className="mx-auto max-w-sm text-sm text-muted">{description}</p>
      </div>
      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
        {phase}
      </span>
    </section>
  );
}

import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Recibe el `id` a asociar con el control (`htmlFor`/`aria-describedby`). */
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

/** Envoltorio de campo de formulario: etiqueta, ayuda y error accesibles. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children({ id, describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Clases compartidas por los controles de formulario. */
export const controlClass =
  'w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-text ' +
  'placeholder:text-muted transition-colors focus-visible:border-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]';

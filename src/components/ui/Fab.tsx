import { Plus } from 'lucide-react';

interface FabProps {
  onClick: () => void;
  label: string;
}

/**
 * Botón de acción flotante. Se ancla por encima de la navegación inferior para
 * que la acción principal (añadir) esté siempre a un toque.
 */
export function Fab({ onClick, label }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-[0_10px_30px_-8px_rgba(176,18,27,0.6)] transition-transform active:scale-95 hover:bg-primary-hover mb-[env(safe-area-inset-bottom)]"
    >
      <Plus size={26} aria-hidden="true" />
    </button>
  );
}

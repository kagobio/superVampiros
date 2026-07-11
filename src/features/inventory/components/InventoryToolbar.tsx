import { ChevronDown, ChevronsDownUp, ChevronsUpDown, ListChecks, X } from 'lucide-react';
import type { SortKey } from '@/domain/inventory/inventory-view';
import { cn } from '@/lib/cn';

interface InventoryToolbarProps {
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  allCollapsed: boolean;
  onToggleCollapseAll: () => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
}

const SORT_LABELS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'quantity', label: 'Cantidad' },
  { value: 'expiry', label: 'Caducidad' },
  { value: 'recent', label: 'Recientes' },
];

const iconButton =
  'flex h-9 items-center gap-1.5 rounded-xl border border-border px-2.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text';

/** Barra de herramientas del inventario: orden, plegar/expandir todo y seleccionar. */
export function InventoryToolbar({
  sort,
  onSortChange,
  allCollapsed,
  onToggleCollapseAll,
  selectionMode,
  onToggleSelectionMode,
}: InventoryToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          aria-label="Ordenar por"
          className="h-9 appearance-none rounded-xl border border-border bg-surface pl-2.5 pr-8 text-xs text-text"
        >
          {SORT_LABELS.map((s) => (
            <option key={s.value} value={s.value}>
              Orden: {s.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleCollapseAll} className={iconButton}>
          {allCollapsed ? (
            <ChevronsUpDown size={15} aria-hidden="true" />
          ) : (
            <ChevronsDownUp size={15} aria-hidden="true" />
          )}
          {allCollapsed ? 'Expandir' : 'Plegar'}
        </button>
        <button
          type="button"
          onClick={onToggleSelectionMode}
          aria-pressed={selectionMode}
          className={cn(
            iconButton,
            selectionMode && 'border-primary bg-primary/10 text-text',
          )}
        >
          {selectionMode ? <X size={15} aria-hidden="true" /> : <ListChecks size={15} aria-hidden="true" />}
          {selectionMode ? 'Cancelar' : 'Seleccionar'}
        </button>
      </div>
    </div>
  );
}

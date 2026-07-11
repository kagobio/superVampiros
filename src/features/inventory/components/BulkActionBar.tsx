import { ChevronDown } from 'lucide-react';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';

interface BulkActionBarProps {
  count: number;
  categories: Category[];
  locations: Location[];
  onAssignCategory: (categoryId: string | null) => void;
  onAssignLocation: (locationId: string | null) => void;
  onDone: () => void;
}

const selectClass =
  'h-10 w-full appearance-none rounded-xl border border-border bg-surface-2 pl-3 pr-8 text-sm text-text';

/**
 * Barra inferior de edición en lote: aparece al seleccionar productos y permite
 * moverlos de categoría o ubicación de golpe. Al elegir un valor se aplica al
 * momento y se vuelve a la opción neutra.
 */
export function BulkActionBar({
  count,
  categories,
  locations,
  onAssignCategory,
  onAssignLocation,
  onDone,
}: BulkActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mb-[env(safe-area-inset-bottom)] border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-muted transition-colors hover:text-text"
          >
            Hecho
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              aria-label="Mover a categoría"
              value=""
              disabled={count === 0}
              onChange={(e) => {
                onAssignCategory(e.target.value === '__none__' ? null : e.target.value);
                e.target.value = '';
              }}
              className={selectClass}
            >
              <option value="" disabled>
                Categoría…
              </option>
              <option value="__none__">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
          <div className="relative flex-1">
            <select
              aria-label="Mover a ubicación"
              value=""
              disabled={count === 0}
              onChange={(e) => {
                onAssignLocation(e.target.value === '__none__' ? null : e.target.value);
                e.target.value = '';
              }}
              className={selectClass}
            >
              <option value="" disabled>
                Ubicación…
              </option>
              <option value="__none__">Sin ubicación</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

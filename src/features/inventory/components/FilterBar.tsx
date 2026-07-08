import { AlertTriangle, PackageX, ShoppingCart, Star, X } from 'lucide-react';
import type { ExpiryWindow, QuickFilter, SortKey } from '@/domain/inventory/inventory-view';
import { hasActiveFilters } from '@/domain/inventory/inventory-view';
import { useFiltersStore } from '@/stores/filters.store';
import { useCategories, useLocations, useTags } from '@/hooks/useTaxonomies';
import { FilterChip } from '@/components/ui/FilterChip';
import { Select } from '@/components/ui/Select';

const QUICK: { id: QuickFilter; label: string; icon: typeof Star }[] = [
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'toBuy', label: 'Para comprar', icon: ShoppingCart },
  { id: 'low', label: 'Poco stock', icon: AlertTriangle },
  { id: 'out', label: 'Sin stock', icon: PackageX },
];

const EXPIRY: { id: ExpiryWindow; label: string }[] = [
  { id: 'today', label: 'Caduca hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'soon', label: 'Caduca pronto' },
  { id: 'expired', label: 'Caducados' },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'name', label: 'Nombre' },
  { id: 'quantity', label: 'Cantidad' },
  { id: 'expiry', label: 'Caducidad' },
  { id: 'recent', label: 'Recientes' },
];

/** Barra de filtros combinables + orden para el inventario. */
export function FilterBar() {
  const filters = useFiltersStore();
  const categories = useCategories();
  const locations = useLocations();
  const tags = useTags();
  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {QUICK.map((q) => (
          <FilterChip
            key={q.id}
            label={q.label}
            icon={q.icon}
            active={filters.quick.includes(q.id)}
            onClick={() => filters.toggleQuick(q.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filtrar por categoría"
          className="h-9 flex-1 text-sm"
          value={filters.categoryId ?? ''}
          onChange={(e) => filters.setCategory(e.target.value || null)}
        >
          <option value="">Categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrar por ubicación"
          className="h-9 flex-1 text-sm"
          value={filters.locationId ?? ''}
          onChange={(e) => filters.setLocation(e.target.value || null)}
        >
          <option value="">Ubicación</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrar por caducidad"
          className="h-9 flex-1 text-sm"
          value={filters.expiryWindow ?? ''}
          onChange={(e) => filters.setExpiryWindow((e.target.value || null) as ExpiryWindow | null)}
        >
          <option value="">Caducidad</option>
          {EXPIRY.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </Select>

        {tags.length > 0 ? (
          <Select
            aria-label="Filtrar por etiqueta"
            className="h-9 flex-1 text-sm"
            value={filters.tagId ?? ''}
            onChange={(e) => filters.setTag(e.target.value || null)}
          >
            <option value="">Etiqueta</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        ) : null}

        <Select
          aria-label="Ordenar por"
          className="h-9 flex-1 text-sm"
          value={filters.sort}
          onChange={(e) => filters.setSort(e.target.value as SortKey)}
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>

        {active ? (
          <button
            type="button"
            onClick={filters.reset}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-sm text-muted hover:text-text"
          >
            <X size={15} aria-hidden="true" />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}

import { CalendarClock, PackageX, ShoppingCart, Star, X } from 'lucide-react';
import { hasActiveFilters } from '@/domain/inventory/inventory-view';
import { useFiltersStore } from '@/stores/filters.store';
import { FilterChip } from '@/components/ui/FilterChip';

/** Barra de filtros rápidos del inventario (conjunto reducido). */
export function FilterBar() {
  const filters = useFiltersStore();
  const active = hasActiveFilters(filters);

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <FilterChip
        label="Para comprar"
        icon={ShoppingCart}
        active={filters.quick.includes('toBuy')}
        onClick={() => filters.toggleQuick('toBuy')}
      />
      <FilterChip
        label="Agotados"
        icon={PackageX}
        active={filters.quick.includes('out')}
        onClick={() => filters.toggleQuick('out')}
      />
      <FilterChip
        label="Caduca pronto"
        icon={CalendarClock}
        active={filters.expiryWindow === 'soon'}
        onClick={() => filters.setExpiryWindow(filters.expiryWindow === 'soon' ? null : 'soon')}
      />
      <FilterChip
        label="Favoritos"
        icon={Star}
        active={filters.quick.includes('favorites')}
        onClick={() => filters.toggleQuick('favorites')}
      />
      {active ? (
        <button
          type="button"
          onClick={filters.reset}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 text-sm text-muted hover:text-text"
        >
          <X size={15} aria-hidden="true" />
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

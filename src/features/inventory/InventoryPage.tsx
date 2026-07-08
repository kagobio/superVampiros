import { useMemo, useState } from 'react';
import { PackageOpen, SearchX } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { applyInventoryView, type InventoryFilters } from '@/domain/inventory/inventory-view';
import { inventoryService } from '@/services/inventory/inventory.service';
import { SEARCH_DEBOUNCE_MS } from '@/config/constants';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories, useLocations, useUnits } from '@/hooks/useTaxonomies';
import { useSettings } from '@/hooks/useSettings';
import { useFiltersStore } from '@/stores/filters.store';
import { useProducts } from './hooks/useProducts';
import { ProductList } from './components/ProductList';
import { ProductFormSheet } from './components/ProductFormSheet';
import { FilterBar } from './components/FilterBar';

export function InventoryPage() {
  const products = useProducts();
  const categories = useCategories();
  const locations = useLocations();
  const units = useUnits();
  const settings = useSettings();

  const filters = useFiltersStore();
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_MS);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Timestamp estable por montaje para calcular estados de caducidad.
  const [now] = useState(() => Date.now());

  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u.abbreviation])), [units]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const locationById = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);

  const subtitleFor = useMemo(
    () => (product: Product) => {
      const parts = [
        product.categoryId ? categoryById.get(product.categoryId) : undefined,
        product.locationId ? locationById.get(product.locationId) : undefined,
      ].filter(Boolean);
      return parts.join(' · ');
    },
    [categoryById, locationById],
  );

  const view: InventoryFilters = {
    search: debouncedSearch,
    quick: filters.quick,
    expiryWindow: filters.expiryWindow,
    categoryId: filters.categoryId,
    locationId: filters.locationId,
    tagId: filters.tagId,
    sort: filters.sort,
  };

  const filtered = useMemo(
    () => applyInventoryView(products, view, now, settings.expirySoonDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      products,
      debouncedSearch,
      filters.quick,
      filters.expiryWindow,
      filters.categoryId,
      filters.locationId,
      filters.tagId,
      filters.sort,
      now,
      settings.expirySoonDays,
    ],
  );

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setSheetOpen(true);
  };
  const adjust = (id: string, delta: number) => {
    void inventoryService.adjustQuantity(id, delta);
  };
  const toggleFavorite = (id: string) => {
    void inventoryService.toggleFavorite(id);
  };

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">Inventario</h1>
        <span className="text-sm text-muted">{filtered.length}</span>
      </div>

      {hasProducts ? (
        <div className="space-y-3">
          <SearchBar
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar producto…"
          />
          <FilterBar />
        </div>
      ) : null}

      {!hasProducts ? (
        <EmptyState
          icon={PackageOpen}
          title="Aún no hay productos"
          description="Añade tu primer producto para empezar a controlar el inventario."
          action={<Button onClick={openCreate}>Añadir producto</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description="Ningún producto coincide con la búsqueda o los filtros activos."
          action={
            <Button variant="secondary" onClick={filters.reset}>
              Quitar filtros
            </Button>
          }
        />
      ) : (
        <ProductList
          products={filtered}
          unitById={unitById}
          subtitleFor={subtitleFor}
          now={now}
          expirySoonDays={settings.expirySoonDays}
          onAdjust={adjust}
          onToggleFavorite={toggleFavorite}
          onOpen={openEdit}
        />
      )}

      <Fab onClick={openCreate} label="Añadir producto" />

      <ProductFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={editing}
        defaultUnitId={settings.defaultUnitId}
      />
    </div>
  );
}

import { useCallback, useMemo, useRef, useState } from 'react';
import { PackageOpen, ScanBarcode, SearchX, ShoppingCart } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import {
  applyInventoryView,
  hasActiveFilters,
  type InventoryFilters,
} from '@/domain/inventory/inventory-view';
import { inventoryService } from '@/services/inventory/inventory.service';
import { lookupBarcode } from '@/services/scan/product-lookup';
import { toast } from '@/stores/toast.store';
import { SEARCH_DEBOUNCE_MS } from '@/config/constants';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories, useLocations, useUnits } from '@/hooks/useTaxonomies';
import { useSettings } from '@/hooks/useSettings';
import { useFiltersStore } from '@/stores/filters.store';
import { ScannerSheet } from '@/features/scan/ScannerSheet';
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
  const [scanBarcode, setScanBarcode] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  // Anti-duplicado del escáner: códigos en curso y su enfriamiento.
  const scanBusy = useRef<Set<string>>(new Set());
  const scanCooldown = useRef<Map<string, number>>(new Map());

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
    setScanBarcode(null);
    setSheetOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setScanBarcode(null);
    setSheetOpen(true);
  };
  const adjust = (id: string, delta: number) => {
    void inventoryService.adjustQuantity(id, delta);
  };
  const toggleFavorite = (id: string) => {
    void inventoryService.toggleFavorite(id);
  };

  // Al escanear: si ya existe el código → +1; si es nuevo → busca el nombre y lo
  // crea; si no se encuentra → abre el formulario para nombrarlo. Un guard evita
  // procesar el mismo código dos veces a la vez (crearía duplicados por la red).
  const handleDetected = useCallback(async (barcode: string) => {
    const cooled = scanCooldown.current.get(barcode);
    if (scanBusy.current.has(barcode) || (cooled && Date.now() - cooled < 3000)) return;
    scanBusy.current.add(barcode);
    try {
      const existing = await inventoryService.getByBarcode(barcode);
      if (existing) {
        const next = await inventoryService.adjustQuantity(existing.id, 1);
        toast(
          `Ya lo tienes · ${existing.name} (${next?.quantity ?? existing.quantity + 1})`,
          'success',
        );
        return;
      }
      const info = await lookupBarcode(barcode);
      if (info?.name) {
        await inventoryService.create({ name: info.name, quantity: 1, barcode });
        toast(`Añadido · ${info.name}`, 'success');
        return;
      }
      setScannerOpen(false);
      setEditing(null);
      setScanBarcode(barcode);
      setSheetOpen(true);
    } finally {
      scanBusy.current.delete(barcode);
      scanCooldown.current.set(barcode, Date.now());
    }
  }, []);

  const hasProducts = products.length > 0;
  const filtersActive = hasActiveFilters(filters) || debouncedSearch.trim() !== '';

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
          description="Escanea un código de barras o añádelo a mano para empezar."
          action={
            <div className="flex gap-2">
              <Button onClick={() => setScannerOpen(true)}>
                <ScanBarcode size={18} aria-hidden="true" />
                Escanear
              </Button>
              <Button variant="secondary" onClick={openCreate}>
                A mano
              </Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        filtersActive ? (
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
          <EmptyState
            icon={ShoppingCart}
            title="Nada en stock ahora mismo"
            description="Los productos agotados no se muestran aquí; los tienes en «Para comprar»."
            action={
              <Button onClick={() => filters.applyPreset({ quick: ['toBuy'] })}>
                Ver para comprar
              </Button>
            }
          />
        )
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

      <Fab
        onClick={() => setScannerOpen(true)}
        label="Escanear código de barras"
        icon={ScanBarcode}
        variant="secondary"
        className="bottom-[8.75rem]"
      />
      <Fab onClick={openCreate} label="Añadir producto" />

      <ScannerSheet
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />

      <ProductFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={editing}
        defaultUnitId={settings.defaultUnitId}
        barcode={scanBarcode}
      />
    </div>
  );
}

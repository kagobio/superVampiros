import { create } from 'zustand';
import {
  EMPTY_FILTERS,
  type ExpiryWindow,
  type InventoryFilters,
  type QuickFilter,
  type SortKey,
} from '@/domain/inventory/inventory-view';

interface FiltersState extends InventoryFilters {
  setSearch: (search: string) => void;
  toggleQuick: (quick: QuickFilter) => void;
  setExpiryWindow: (window: ExpiryWindow | null) => void;
  setCategory: (categoryId: string | null) => void;
  setLocation: (locationId: string | null) => void;
  setTag: (tagId: string | null) => void;
  setSort: (sort: SortKey) => void;
  /** Sustituye los filtros de golpe (p. ej. al pulsar una métrica del dashboard). */
  applyPreset: (preset: Partial<InventoryFilters>) => void;
  reset: () => void;
}

/**
 * Estado de búsqueda + filtros + orden del inventario. Es estado de UI (no dato
 * de dominio), por eso vive en Zustand. Se comparte entre el dashboard (que fija
 * presets al pulsar una métrica) y la pantalla de inventario.
 */
export const useFiltersStore = create<FiltersState>((set) => ({
  ...EMPTY_FILTERS,
  setSearch: (search) => set({ search }),
  toggleQuick: (quick) =>
    set((s) => ({
      quick: s.quick.includes(quick) ? s.quick.filter((q) => q !== quick) : [...s.quick, quick],
    })),
  setExpiryWindow: (expiryWindow) => set({ expiryWindow }),
  setCategory: (categoryId) => set({ categoryId }),
  setLocation: (locationId) => set({ locationId }),
  setTag: (tagId) => set({ tagId }),
  setSort: (sort) => set({ sort }),
  applyPreset: (preset) => set({ ...EMPTY_FILTERS, ...preset }),
  reset: () => set({ ...EMPTY_FILTERS }),
}));

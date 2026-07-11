import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CollapsedCategoriesState {
  /** Mapa id de categoría → true si está plegada en el inventario. */
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
  /** Pliega o despliega varias categorías de golpe (plegar/expandir todo). */
  setMany: (ids: string[], collapsed: boolean) => void;
}

/**
 * Recuerda qué categorías del inventario están plegadas. Es estado de UI (no
 * dato de dominio), por eso vive en Zustand y se persiste en localStorage para
 * que las secciones sigan como las dejó el usuario entre sesiones.
 */
export const useCollapsedCategories = create<CollapsedCategoriesState>()(
  persist(
    (set) => ({
      collapsed: {},
      toggle: (id) => set((s) => ({ collapsed: { ...s.collapsed, [id]: !s.collapsed[id] } })),
      setMany: (ids, collapsed) =>
        set((s) => {
          const next = { ...s.collapsed };
          for (const id of ids) next[id] = collapsed;
          return { collapsed: next };
        }),
    }),
    { name: 'vamp-collapsed-categories' },
  ),
);

import { ChevronDown } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import type { ProductGroup } from '@/domain/inventory/inventory-view';
import { useCollapsedCategories } from '@/stores/collapsed-categories.store';
import { cn } from '@/lib/cn';
import { ProductCard } from './ProductCard';

interface GroupedProductListProps {
  groups: ProductGroup[];
  unitById: Map<string, string>;
  subtitleFor: (product: Product) => string;
  now: number;
  expirySoonDays: number;
  onAdjust: (id: string, delta: number) => void;
  onOpen: (product: Product) => void;
}

/**
 * Inventario agrupado por categoría en secciones plegables. Cada cabecera muestra
 * el color y el número de productos, y al pulsarla se pliega/despliega la sección
 * (el estado se recuerda). Facilita encontrar productos sin una lista interminable.
 */
export function GroupedProductList({
  groups,
  unitById,
  subtitleFor,
  now,
  expirySoonDays,
  onAdjust,
  onOpen,
}: GroupedProductListProps) {
  const collapsed = useCollapsedCategories((s) => s.collapsed);
  const toggle = useCollapsedCategories((s) => s.toggle);

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const isCollapsed = collapsed[group.id] ?? false;
        return (
          <section key={group.id}>
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={cn(
                  'shrink-0 text-muted transition-transform',
                  isCollapsed && '-rotate-90',
                )}
              />
              {group.color ? (
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
              ) : null}
              <span className="font-display text-sm font-medium text-text">{group.name}</span>
              <span className="text-xs text-muted">{group.products.length}</span>
            </button>

            {!isCollapsed ? (
              <div className="mt-2 space-y-2.5">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    unitAbbrev={product.unitId ? unitById.get(product.unitId) : undefined}
                    subtitle={subtitleFor(product)}
                    now={now}
                    expirySoonDays={expirySoonDays}
                    onAdjust={onAdjust}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
